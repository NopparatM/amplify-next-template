import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource';
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";

const backend = defineBackend({
  auth,
  data
});

const customBucketStack = backend.createStack("custom-bucket-stack");

// Import existing bucket
const customBucket = Bucket.fromBucketAttributes(customBucketStack, "KaewpotterBucket", {
  bucketArn: "arn:aws:s3:::kaewpotter-01sep2025"
});

// ✅ Only add an *extra* bucket under storage.buckets
backend.addOutput({
  storage: {
    buckets: [
      {
        name: customBucket.bucketName,
        bucket_name: customBucket.bucketName,
        aws_region: backend.stack.region
      }
    ]
  }
});

// IAM policy for authenticated users
const authPolicy = new Policy(backend.stack, "CustomBucketAuthPolicy", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:ListBucket"],
      resources: [customBucket.bucketArn],
      conditions: {
        StringLike: { "s3:prefix": ["public/*", "public/"] }
      }
    }),
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources: [`${customBucket.bucketArn}/public/*`]
    })
  ]
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(authPolicy);
