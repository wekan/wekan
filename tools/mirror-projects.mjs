import { cliApi } from './mirror-active-forges.mjs';
import { validateRepository, organization } from './mirror-repository.mjs';

// Project connections and every nested field-value connection are paginated.
// Authentication/schema errors must not turn into an empty authoritative export.
export async function connection(request, query, variables, pick) {
  const nodes = [], seen = new Set();
  let after = null;
  for (;;) {
    const result = await request(query, { ...variables, after });
    if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join('; '));
    const value = pick(result.data);
    if (!value || !Array.isArray(value.nodes) || !value.pageInfo || typeof value.pageInfo.hasNextPage !== 'boolean') throw new Error('Incomplete GitHub project connection');
    if (value.nodes.some(n => !n)) throw new Error('Inaccessible GitHub project item');
    nodes.push(...value.nodes);
    if (!value.pageInfo.hasNextPage) return nodes;
    const cursor = value.pageInfo.endCursor;
    if (!cursor || seen.has(cursor)) throw new Error('Repeated GitHub project pagination cursor');
    seen.add(cursor); after = cursor;
  }
}
const page = 'pageInfo { hasNextPage endCursor }';
const field = `nodes {
  __typename
  ... on ProjectV2Field { id name dataType }
  ... on ProjectV2MultiSelectField { id name dataType multiSelectOptions { id name color description } }
  ... on ProjectV2SingleSelectField { id name dataType options { id name color description } }
  ... on ProjectV2IterationField { id name dataType configuration { duration startDay iterations { id title startDate duration } completedIterations { id title startDate duration } } }
}`;
const value = `nodes {
  __typename
  ... on ProjectV2ItemIssueFieldValue { field { ... on ProjectV2FieldCommon { id name } } issueFieldValue { __typename ... on IssueFieldTextValue { id value } ... on IssueFieldDateValue { id value } ... on IssueFieldNumberValue { id numberValue:value } ... on IssueFieldSingleSelectValue { id value name optionId color description } ... on IssueFieldMultiSelectValue { id multiSelectValue:value options { id name color description } } } }
  ... on ProjectV2ItemFieldMultiSelectValue { id value options { id name color description } field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldTextValue { id text field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldNumberValue { id number field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldDateValue { id date field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldSingleSelectValue { id name optionId field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldIterationValue { id title iterationId startDate duration field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldMilestoneValue { milestone { id title url } field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldLabelValue { field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldUserValue { field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldReviewerValue { field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldPullRequestValue { field { ... on ProjectV2FieldCommon { id name } } }
  ... on ProjectV2ItemFieldRepositoryValue { repository { id nameWithOwner url } field { ... on ProjectV2FieldCommon { id name } } }
}`;
export async function projectsForRepository(repository, request = (query, variables) => cliApi('github', 'graphql', 'POST', { query, variables }), owner = organization) {
  validateRepository(repository);
  const projects = await connection(request,
    `query($name:String!,$owner:String!,$after:String) { repository(owner:$owner,name:$name) { projectsV2(first:100,after:$after) { ${page} nodes { id number title url shortDescription readme public closed createdAt updatedAt } } } }`,
    { name: repository,owner }, d => d?.repository?.projectsV2);
  for (const project of projects) {
    project.fields = await connection(request,
      `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2 { fields(first:100,after:$after) { ${page} ${field} } } } }`,
      { id: project.id }, d => d?.node?.fields);
    project.statusUpdates = await connection(request,
      `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2 { statusUpdates(first:100,after:$after) { ${page} nodes { id body status startDate targetDate createdAt updatedAt creator { login } } } } } }`,
      {id:project.id},d=>d?.node?.statusUpdates);
    project.workflows = await connection(request,
      `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2 { workflows(first:100,after:$after) { ${page} nodes { id name number enabled createdAt updatedAt } } } } }`,
      {id:project.id},d=>d?.node?.workflows);
    project.views = await connection(request,
      `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2 { views(first:100,after:$after) { ${page} nodes { id name number layout filter createdAt updatedAt } } } } }`,
      {id:project.id},d=>d?.node?.views);
    for (const view of project.views) {
      for (const key of ['fields','groupByFields','verticalGroupByFields','sortByFields']) {
        const selection=key==='sortByFields' ? 'nodes { direction field { __typename ... on ProjectV2FieldCommon { id name dataType } } }' : field;
        view[key]=await connection(request,
          `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2View { ${key}(first:100,after:$after) { ${page} ${selection} } } } }`,
          {id:view.id},d=>d?.node?.[key]);
      }
    }
    project.items = await connection(request,
      `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2 { items(first:100,after:$after) { ${page} nodes { id type createdAt updatedAt isArchived content { __typename ... on Issue { id number title body url repository { nameWithOwner url } } ... on PullRequest { id number title body url repository { nameWithOwner url } } ... on DraftIssue { id title body } } } } } } }`,
      { id: project.id }, d => d?.node?.items);
    for (const item of project.items) {
      if (item.content === null) throw new Error('Inaccessible or redacted GitHub project item content');
      item.fieldValues = await connection(request,
        `query($id:ID!,$after:String) { node(id:$id) { ... on ProjectV2Item { fieldValues(first:100,after:$after) { ${page} ${value} } } } }`,
        { id: item.id }, d => d?.node?.fieldValues);
      // Connection-valued labels, assignees, reviewers and linked PRs need their
      // own cursor; exporting only the first 100 would silently lose data.
      for (const [type, key, selection] of [
        ['ProjectV2ItemFieldLabelValue', 'labels', 'id name color description'],
        ['ProjectV2ItemFieldUserValue', 'users', 'id login name url'],
        ['ProjectV2ItemFieldReviewerValue', 'reviewers', '__typename ... on User { id login userName:name url } ... on Team { id teamName:name slug url }'],
        ['ProjectV2ItemFieldPullRequestValue', 'pullRequests', 'id number title url repository { nameWithOwner url }'],
      ]) {
        for (const fieldValue of item.fieldValues.filter(v => v.__typename === type)) {
          // These field-value objects are not Nodes; address them through the
          // owning item's field name rather than assuming an unsupported ID.
          const all = await connection(request,
            `query($id:ID!,$field:String!,$after:String) { node(id:$id) { ... on ProjectV2Item { fieldValueByName(name:$field) { ... on ${type} { ${key}(first:100,after:$after) { ${page} nodes { ${selection} } } } } } } }`,
            { id: item.id, field: fieldValue.field.name }, d => d?.node?.fieldValueByName?.[key]);
          fieldValue[key] = all;
        }
      }
    }
  }
  return projects;
}
