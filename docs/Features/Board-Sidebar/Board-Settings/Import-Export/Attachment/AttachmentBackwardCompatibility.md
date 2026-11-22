# Attachment Backward Compatibility

## What it is

This document describes the backward compatibility implementation for Wekan attachments, allowing the system to read attachments from both the old CollectionFS structure (Wekan v6.09 and earlier) and the new Meteor-Files structure (Wekan v7.x and later).

When Wekan migrated from CollectionFS to Meteor-Files (ostrio-files), the database structure for attachments changed significantly. This backward compatibility layer ensures that:

1. Old attachments can still be accessed and downloaded
2. No database migration is required
3. Both old and new attachments can coexist
4. The UI works seamlessly with both structures

## Read more

- [Meteor-Files](https://github.com/veliovgroup/Meteor-Files)
- [MongoDB GridFS](https://www.mongodb.com/docs/manual/core/gridfs/)
- [Wikipedia: Backward compatibility](https://en.wikipedia.org/wiki/Backward_compatibility)
- [Enhanced attachment migration system](Attachment-Migration-System.md)

## How to use it

### Usage

#### Automatic Fallback
The system automatically falls back to the old structure when:
- An attachment is not found in the new structure
- Querying attachments for a card returns no results

#### Legacy Download URLs
Old attachment download URLs (`/cfs/files/attachments/:id`) continue to work and are handled by the legacy route.

#### Migration (Optional)
Users can optionally migrate their old attachments to the new structure using the migration methods:

```javascript
// Migrate a single attachment
Meteor.call('migrateAttachment', attachmentId);

// Migrate all attachments for a card
Meteor.call('migrateCardAttachments', cardId);

// Check migration status
Meteor.call('getAttachmentMigrationStatus', cardId);
```

### Troubleshooting

#### Common Issues

1. **Old attachments not showing**
   - Check that old CollectionFS collections exist in database
   - Verify GridFS bucket is accessible
   - Check server logs for errors

2. **Download failures**
   - Verify GridFS connection
   - Check file permissions
   - Ensure legacy route is loaded

3. **Performance issues**
   - Consider migrating old attachments to new structure
   - Check database indexes
   - Monitor query performance

#### Debug Mode

Enable debug logging by setting:
```javascript
console.log('Legacy attachments route loaded');
```

This will help identify if the backward compatibility layer is properly loaded.

### Migration Path

For users who want to fully migrate to the new structure:

1. Use the migration methods to convert old attachments
2. Verify all attachments are working
3. Remove old CollectionFS collections (optional)
4. Update any hardcoded URLs to use new structure

The backward compatibility layer ensures that migration is optional and can be done gradually.

## How the numbers are calculated

The layer has no numbers of its own: it reads an attachment from the old
CollectionFS collections when it is not found in the new `attachments`
collection, and nothing is counted, limited or scheduled.

## How it works in WeKan

### Database Structure Changes

#### Old Structure (CollectionFS)
- **CollectionFS Files**: `cfs_gridfs.attachments.files`
- **CollectionFS Records**: `cfs.attachments.filerecord`
- **File Storage**: GridFS with bucket name `cfs_gridfs.attachments`

#### New Structure (Meteor-Files)
- **Files Collection**: `attachments`
- **File Storage**: Configurable (Filesystem, GridFS, or S3)

### Implementation Details

#### Files Added/Modified

1. **`models/lib/attachmentBackwardCompatibility.js`**
   - Main backward compatibility layer
   - Handles reading from old CollectionFS structure
   - Converts old data format to new format
   - Provides GridFS streaming for downloads

2. **`models/attachments.js`**
   - Added backward compatibility methods to Attachments collection
   - Imports compatibility functions

3. **`imports/reactiveCache.js`**
   - Updated to use backward compatibility layer
   - Falls back to old structure when new structure has no results

4. **`server/routes/legacyAttachments.js`**
   - Handles legacy attachment downloads via `/cfs/files/attachments/:id`
   - Provides proper HTTP headers and streaming

5. **`server/migrations/migrateAttachments.js`**
   - Migration methods for converting old attachments to new structure
   - Optional migration tools for users who want to fully migrate

#### Key Functions

##### `getAttachmentWithBackwardCompatibility(attachmentId)`
- Tries new structure first, falls back to old structure
- Returns attachment data in new format
- Handles both single attachment lookups

##### `getAttachmentsWithBackwardCompatibility(query)`
- Queries both old and new structures
- Combines and deduplicates results
- Used for card attachment lists

##### `getOldAttachmentData(attachmentId)`
- Reads from old CollectionFS structure
- Converts old format to new format
- Handles file type detection and metadata

##### `getOldAttachmentStream(attachmentId)`
- Creates GridFS download stream for old attachments
- Used for file downloads

### Performance Considerations

1. **Query Optimization**: The system queries the new structure first, only falling back to old structure when necessary
2. **Caching**: ReactiveCache handles caching for both old and new attachments
3. **Streaming**: Large files are streamed efficiently using GridFS streams

### Error Handling

- Graceful fallback when old structure is not available
- Proper error logging for debugging
- HTTP error codes for download failures
- Permission checks for both old and new attachments

### Security

- Permission checks are maintained for both old and new attachments
- Board access rules apply to legacy attachments
- File type validation is preserved

### Testing

To test the backward compatibility:

1. Ensure you have old Wekan v6.09 data with attachments
2. Upgrade to Wekan v7.x
3. Verify that old attachments are visible in the UI
4. Test downloading old attachments
5. Verify that new attachments work normally

### Future Considerations

- The backward compatibility layer can be removed in future versions
- Users should be encouraged to migrate old attachments
- Consider adding migration tools to the admin interface
- Monitor usage of old vs new structures

## Commits

 - [Attachment code shares what it had copied: API limits, headers, downloads](https://github.com/wekan/wekan/commit/27c3716f3d150fb63ab07b2c476cc8c7279196ed)
 - [Close the CacheBleed siblings: API answers are no-store, legacy attachments private](https://github.com/wekan/wekan/commit/cd4c8064ae7b3b85bacc62f6ecd07df3a461ecab)
 - [Fixed Admin Panel / Attachments / Move Attachment doing nothing / crashing.   Several issues in the bulk move: - The ](https://github.com/wekan/wekan/commit/d30803276d6d06db44f65ee1fb583cc11aac8b7b)
 - [Fix attachment download error with non-ASCII filenames](https://github.com/wekan/wekan/commit/2e564bd076cc3093c0e4a42202e886a09aab186c)
 - [Show console.log 'Legacy attachments route loaded' only when environment variable DEBUG=true](https://github.com/wekan/wekan/commit/1c84b19f246ebe6d3cad4f56726013147756d9c3)
 - [Use attachments from old CollectionFS database structure, when not yet migrated to Meteor-Files/ostrio-files, without ](https://github.com/wekan/wekan/commit/a8de2f224f61d0e5c7061fefb1cdd4f45f3bb020)
