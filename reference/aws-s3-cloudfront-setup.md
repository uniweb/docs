# AWS S3 + CloudFront — one-time setup

This page walks through provisioning the AWS resources that `uniweb deploy --host=s3-cloudfront` expects. You only do this once per site. After it's done, every deploy is `uniweb deploy` and that's it.

If you already have an S3 bucket + CloudFront distribution and just want the Uniweb-specific bits, jump to [I already have AWS infrastructure](#i-already-have-aws-infrastructure).

If you're starting from scratch, follow the sections in order.

> **Related:** [Deployment overview](deployment.md) covers all hosts (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, etc.). This page is the deep-dive for AWS.

---

## What you'll create

- An **S3 bucket** that holds the built site (`dist/`).
- A **CloudFront distribution** that fronts the bucket as the public origin.
- An **Origin Access Control (OAC)** that lets the distribution read from the bucket while keeping the bucket private to the rest of the internet.
- A **CloudFront Function** that resolves directory paths (`/about` → `/about/index.html`).
- An **IAM user (or role)** with the minimum permissions `uniweb deploy` needs.

The IAM user explicitly *cannot* mutate distribution config or create functions — provisioning is a one-time setup; deploys can only push files and invalidate.

---

## Prerequisites

Before you start:

- An AWS account.
- The `aws` CLI installed locally and configured. macOS: `brew install awscli`.
- A site that builds with `uniweb build` (try it once before deploying).

---

## Starting from scratch

### 1. Create an S3 bucket

In the AWS Console: **S3** → **Create bucket**.

| Setting | Value |
|---|---|
| Bucket name | Globally unique — pick your own |
| AWS Region | Any region (see below) |
| Object Ownership | ACLs disabled (default) |
| Block Public Access | **All four ON** (the default) |
| Bucket Versioning | Optional |
| Default encryption | SSE-S3 (default) |
| Static website hosting | **Do NOT enable** (see below) |

**Bucket name.** Must be globally unique across all AWS accounts. We use `uniweb-app-marketing` as the example below — pick your own.

**AWS Region.** Any region works. Pick what's close to your users or matches the rest of your infra.

**Block Public Access.** Leave all four boxes **ON** — do not unblock anything. The bucket stays private; CloudFront reaches it via OAC.

**Bucket Versioning.** Enable if you want rollback-by-S3-version. Optional otherwise.

**Static website hosting.** Do not enable this. We use the bucket's REST endpoint via OAC, not the website endpoint. The two are mutually exclusive — the website endpoint requires a public bucket, which we don't want. See the note below.

Click **Create bucket**.

> **Why not enable static website hosting?** The website endpoint requires the bucket to be public — anyone with the URL can bypass CloudFront's WAF, logging, and security headers. The REST endpoint via OAC keeps the bucket private and only reachable through your distribution.

### 2. Create the CloudFront Function

CloudFront Functions are global — no region.

In the AWS Console: **CloudFront** → **Functions** → **Create function**.

| Setting | Value |
|---|---|
| Name | `uniweb-directory-index` |
| Runtime | `cloudfront-js-2.0` |

Click **Next**, paste the source from your build's `dist/cloudfront-function.js`:

```js
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    } else if (!uri.split('/').pop().includes('.')) {
        request.uri = uri + '/index.html';
    }
    return request;
}
```

Click **Save changes**, then **Publish** at the top of the function page (this promotes the development version to LIVE — required before you can attach it to a distribution).

> **What the function does.** S3's REST endpoint doesn't auto-resolve directory indexes. `/about` against S3 returns 403 because there's no object literally named `about`. The function rewrites `/about` to `/about/index.html` at the edge, before the cache lookup.

### 3. Create the CloudFront distribution

In the AWS Console: **CloudFront** → **Distributions** → **Create distribution**.

#### Distribution type
Pick **Single website or app**.

> **Not "Multi-tenant"** — that's for SaaS providers serving many customer-owned domains from shared edge config. For a single site, even one that combines marketing + app behind path-based routing later, the single-distribution path is right.

#### Origin

| Setting | Value |
|---|---|
| Origin domain | Your bucket's REST endpoint (see below) |
| Origin path | leave empty |
| Origin access | Origin access control settings (recommended) |
| Origin access control | Click **Create new OAC** (see below) |

**Origin domain.** Pick the bucket from the dropdown (e.g. `uniweb-app-marketing.s3.ca-central-1.amazonaws.com`). Pick the REST endpoint, **not** the static-website endpoint.

**Origin access control.** Click **Create new OAC**. Name it `uniweb-app-oac`. Sign requests = "Yes, sign requests (recommended)". Origin type = S3. Click **Create**.

A blue alert appears: *"You must update the S3 bucket policy."* Leave it for now; you'll do this in step 4 once the distribution exists.

#### Default cache behavior
| Setting | Value |
|---|---|
| Path pattern | Default (\*) |
| Viewer protocol policy | **Redirect HTTP to HTTPS** |
| Allowed HTTP methods | GET, HEAD |
| Cache policy | **CachingOptimized** (AWS-managed) |
| Origin request policy | None |
| Compress objects automatically | **Yes** |

#### Function associations
| Setting | Value |
|---|---|
| Viewer request — Function type | **CloudFront Functions** |
| Viewer request — Function ARN/Name | `uniweb-directory-index` (the one you published in step 2) |

Leave all other association slots empty.

#### Settings

| Setting | Value |
|---|---|
| Price class | See below — pick what fits your traffic |
| Alternate domain name (CNAME) | Leave empty for now |
| Default root object | `index.html` |

**Price class.** "Use only North America and Europe" is the cheapest option. "All edge locations" gives global edge presence. Pick by where your users are.

**Alternate domain name (CNAME).** Leave empty for now — we're using the auto-generated `*.cloudfront.net` domain. Add a real domain later when you're ready (see [Pointing your custom domain](#pointing-your-custom-domain) below).

Click **Create distribution**.

CloudFront takes 3–5 minutes to fully deploy. Status goes `Deploying` → `Enabled`. You can continue with steps 4–6 while it deploys.

### 4. Bucket policy — grant CloudFront read access

After the distribution is created, AWS shows a banner with a copyable bucket policy, or you can paste the one below.

Go to **S3** → your bucket → **Permissions** → **Bucket policy** → **Edit**:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::YOUR-AWS-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
      }
    }
  }]
}
```

Replace `YOUR-BUCKET-NAME`, `YOUR-AWS-ACCOUNT-ID` (12 digits, top-right of the console), and `YOUR-DISTRIBUTION-ID` (e.g. `E1ABC...`).

Click **Save changes**.

### 5. Custom error responses

In the distribution → **Error pages** tab → **Create custom error response**, do this twice:

| Field | 404 entry | 403 entry |
|---|---|---|
| HTTP error code | 404: Not Found | 403: Forbidden |
| Customize error response | Yes | Yes |
| Response page path | `/404.html` | `/404.html` |
| HTTP Response code | 404 | 404 |
| Error caching minimum TTL | 60 | 60 |

> **Why both 403 and 404?** S3 returns 403 for missing-object-via-OAC (not 404). Map both to your branded `/404.html` so genuinely-not-found paths return real 404 status with the marketing 404 page.
>
> **Don't** map 404 → `/index.html` with status 200. Pre-rendered Uniweb sites have real files at every known route; legitimate 404s should return real 404 status.

### 6. IAM user for `uniweb deploy`

Go to **IAM** → **Users** → **Create user**.

| Setting | Value |
|---|---|
| User name | e.g. `uniweb-app-deploy` |

In **permissions**: choose **Attach policies directly** → **Create policy** → JSON tab → paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Sync",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution"
      ],
      "Resource": "arn:aws:cloudfront::YOUR-AWS-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
    }
  ]
}
```

Replace the same three values as in step 4. Save the policy as `uniweb-app-deploy-policy`. Attach it to the user. Finish creating the user.

This policy grants only what `uniweb deploy` needs: push files, delete files, list the bucket, create invalidations, and read distribution metadata for preflight + post-deploy verification. **It explicitly does NOT grant `cloudfront:UpdateDistribution` or `cloudfront:CreateFunction`** — distribution config and function attachment are one-time provisioning steps you do via the console (or your IaC); deploys can never mutate them.

### 7. Create an access key for the IAM user

Open the user → **Security credentials** tab → **Create access key**.

- Use case: **Command Line Interface (CLI)**.
- Description tag: `uniweb-app local deploy`.

Click **Create access key**. Copy the **Access key ID** and **Secret access key** immediately — the secret is only shown once.

### 8. Configure the AWS CLI locally

Use a named profile so deploy creds don't collide with other AWS work:

```bash
aws configure --profile uniweb-app-deploy
```

Prompts:

```
AWS Access Key ID [None]: AKIA...
AWS Secret Access Key [None]: ...
Default region name [None]: <your-bucket-region>
Default output format [None]: json
```

Verify:

```bash
aws --profile uniweb-app-deploy sts get-caller-identity
aws --profile uniweb-app-deploy s3 ls s3://YOUR-BUCKET-NAME/
aws --profile uniweb-app-deploy cloudfront get-distribution --id YOUR-DISTRIBUTION-ID --query 'Distribution.Status'
```

You should see your IAM user's ARN, an empty bucket listing (not `AccessDenied`), and `"Deployed"` (not `"InProgress"`).

You're done with AWS setup. Skip to [Wire it into deploy.yml](#wire-it-into-deployyml).

---

## I already have AWS infrastructure

If you already have an S3 bucket + CloudFront distribution serving a static site, three things are specific to Uniweb:

### 1. Attach the directory-index Function

CloudFront → Functions → Create function (viewer-request, JS 2.0). Paste the source from your build's `dist/cloudfront-function.js` (or copy from [step 2 above](#2-create-the-cloudfront-function)). Publish, then associate it with your distribution's default cache behavior as **Viewer request**.

### 2. Add 404 + 403 custom error responses

Both → `/404.html` with status 404. See [step 5 above](#5-custom-error-responses) for details.

### 3. Confirm IAM permissions for the deploy user

The deploy user/role needs:

- `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject`, `s3:ListBucket` on the bucket.
- `cloudfront:CreateInvalidation`, `cloudfront:GetDistribution` on the distribution.

See [step 6 above](#6-iam-user-for-uniweb-deploy) for the exact policy JSON.

---

## Wire it into `deploy.yml`

Create `deploy.yml` next to your `site.yml`:

```yaml
default: production

targets:
  production:
    host: s3-cloudfront
    bucket: YOUR-BUCKET-NAME
    distributionId: YOUR-DISTRIBUTION-ID
    region: YOUR-BUCKET-REGION
    profile: uniweb-app-deploy        # optional — omit if using default credentials
```

Replace the four substitutions with your real values. Optional fields like `cacheRules` and `invalidationPaths` have sensible defaults; see [Deployment reference](deployment.md) for the full schema.

The `lastDeploy:` block at the bottom of `deploy.yml` is auto-managed by `uniweb deploy` after each successful deploy. Don't edit it by hand.

---

## First deploy

```bash
cd path/to/your-site
uniweb deploy
```

The CLI runs build → preflight → S3 sync → CloudFront invalidation → writes `lastDeploy.<target>` to `deploy.yml`. You should see the distribution domain printed in the success output. Hit it in a browser:

```
https://YOUR-DISTRIBUTION.cloudfront.net/
https://YOUR-DISTRIBUTION.cloudfront.net/about
https://YOUR-DISTRIBUTION.cloudfront.net/this-does-not-exist   # should 404 with /404.html
```

If `/about` returns 404, the CloudFront Function isn't attached. Re-check [step 2](#2-create-the-cloudfront-function).

---

## Pointing your custom domain

When you're ready to use a real domain (`yoursite.com`):

1. Request an ACM certificate in **us-east-1** for `yoursite.com` (and `www.yoursite.com` if needed). DNS-validated.
2. In the CloudFront distribution → **General** tab → **Edit** → add the domain to **Alternate domain names (CNAMEs)** and select the cert.
3. Point your DNS to the distribution domain (`YOUR-DISTRIBUTION.cloudfront.net`) via CNAME or alias record.

ACM cert region is the only US-East-1 dependency in this setup. The bucket can stay wherever you put it.

---

## Troubleshooting

**`/about` returns 404, but `/about/index.html` works.**
The CloudFront Function isn't attached. See [step 2](#2-create-the-cloudfront-function).

**All paths return 403 Forbidden.**
The bucket policy isn't granting CloudFront's OAC read access, or the policy's `AWS:SourceArn` doesn't match the distribution. See [step 4](#4-bucket-policy--grant-cloudfront-read-access).

**`uniweb deploy` fails with `AccessDenied` on `s3 sync`.**
The IAM user is missing `s3:PutObject` or `s3:ListBucket` on the bucket. See [step 6](#6-iam-user-for-uniweb-deploy).

**`uniweb deploy` fails with `NoSuchBucket`.**
Bucket name in `deploy.yml` is wrong, or the region is wrong (S3 buckets are region-bound). See `deploy.yml` `bucket` and `region`.

**Edge serves stale content after deploy.**
CloudFront invalidation is fire-and-forget — propagation takes 30s–2min. New visitors will see fresh content within that window. Hard-refresh your browser if you're testing.

**404 page returns 200 status.**
A custom error response is mis-configured — check the **HTTP Response code** field on the error response (must be 404, not 200). See [step 5](#5-custom-error-responses).

---

## See also

- [Deployment overview](deployment.md) — all supported hosts, when to pick which.
- [Deploying with Uniweb](../development/deploying.md) — conceptual guide to the two-artifact model.
- [CLI commands](cli-commands.md) — `uniweb deploy` flags.
