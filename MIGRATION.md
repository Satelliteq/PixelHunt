# Supabase to Firebase Migration Guide

This document outlines the process of migrating the Pixelhunt application from Supabase (SQL) to Firebase (NoSQL).

## Migration Overview

### Why Migrate?

- **Scalability**: Firebase provides automatic scaling for applications with growing user bases
- **Real-time capabilities**: Firebase offers real-time database functionality out of the box
- **Simplified authentication**: Firebase Auth provides a comprehensive authentication system
- **Reduced maintenance**: Serverless architecture reduces backend maintenance
- **Cost efficiency**: Firebase's free tier and pay-as-you-go model can be more cost-effective

### Migration Components

1. **Database**: Migrating from PostgreSQL (Supabase) to Firestore (Firebase)
2. **Authentication**: Migrating from Supabase Auth to Firebase Authentication
3. **Storage**: Migrating from Supabase Storage to Firebase Storage
4. **API**: Replacing Supabase API calls with Firebase SDK calls

## Data Model Changes

### SQL to NoSQL Transformation

| Supabase (SQL)     | Firebase (NoSQL)   | Notes                                      |
|--------------------|--------------------|--------------------------------------------|
| users              | users              | User profiles and authentication data      |
| categories         | categories         | Test categories                            |
| images             | images             | Image data with answers                    |
| tests              | tests              | Tests with embedded questions              |
| test_comments      | testComments       | Comments on tests                          |
| game_scores        | gameScores         | User game performance                      |
| user_activities    | userActivities     | User action logs                           |

### Key Structure Changes

1. **Numeric IDs to String IDs**: Firebase uses string document IDs instead of auto-incrementing numeric IDs
2. **Embedded Data**: Questions are now embedded in test documents rather than referenced by IDs
3. **Denormalization**: Some data is denormalized for faster reads
4. **Timestamps**: Using Firebase server timestamps instead of PostgreSQL timestamps
5. **References**: Using string IDs for references instead of foreign keys

## Migration Process

### Prerequisites

1. Firebase project set up with Firestore and Storage enabled
2. Firebase service account credentials
3. Node.js environment for running migration scripts

### Migration Steps

1. **Export Data from Supabase**:
   ```bash
   npm run migrate:firebase
   ```

2. **Update Application Code**:
   - Replace Supabase client with Firebase SDK
   - Update authentication flows
   - Update database queries
   - Update storage operations

3. **Verify Migration**:
   - Test all CRUD operations
   - Verify authentication flows
   - Check data integrity

## Post-Migration Tasks

1. **Update Security Rules**: Configure Firestore and Storage security rules
2. **Set up Backups**: Configure regular backups for Firestore data
3. **Monitoring**: Set up Firebase monitoring and alerts
4. **Performance Optimization**: Review and optimize queries for Firestore

## Rollback Plan

In case of migration issues, a rollback plan is in place:

1. Keep the Supabase project active during the transition period
2. Maintain dual-write capability for critical operations
3. Have a script ready to sync any new data back to Supabase if needed

## Testing

The migration has been tested in the following environments:

- Development environment
- Staging environment with production data copy
- Production environment with limited user access

## Contact

For any issues or questions regarding the migration, please contact the development team.