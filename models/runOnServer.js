/**
 * Executes a function only if we are on the server. Use in combination
 * with package-sepcific loader functions to create a "nested" import that
 * prevents leakage of server-dependencies to the client.
 * @param fct {function} the function to be executed on the server
 * @return {*} a return value from the function, if there is any
 */
export const runOnServer = fct => Meteor.isServer && fct();
