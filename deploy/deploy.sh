#!/usr/bin/env bash
# 상담 폼 메일 전송 Lambda 배포 (최초 1회 + 코드 갱신 시 재실행 가능)
set -euo pipefail
cd "$(dirname "$0")"

REGION="${REGION:-ap-northeast-2}"
FN="jjlaw-contact-mailer"
ROLE="jjlaw-contact-mailer-role"
TO_EMAIL="kjjlawyer@gmail.com"
FROM_EMAIL="kjjlawyer@gmail.com"
ALLOWED_ORIGINS="https://www.jjlaw.co.kr,https://jjlaw.co.kr,http://localhost:3001"

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# 1. SES 발신 주소 검증 요청 (메일의 링크를 클릭해야 완료됨)
aws sesv2 create-email-identity --region "$REGION" --email-identity "$FROM_EMAIL" >/dev/null 2>&1 || true
[ "$TO_EMAIL" != "$FROM_EMAIL" ] && aws sesv2 create-email-identity --region "$REGION" --email-identity "$TO_EMAIL" >/dev/null 2>&1 || true

# 2. IAM 역할
if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE" --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam attach-role-policy --role-name "$ROLE" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  aws iam put-role-policy --role-name "$ROLE" --policy-name ses-send --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ses:SendEmail","ses:SendRawEmail"],"Resource":"*"}]}'
  echo "IAM 역할 생성 — 전파 대기 10초"; sleep 10
fi
ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/${ROLE}"

# 3. 패키징 (SDK v3는 Node 20 런타임에 내장)
rm -f lambda.zip; python -c "import zipfile; zipfile.ZipFile('lambda.zip','w',zipfile.ZIP_DEFLATED).write('lambda/index.mjs','index.mjs')"

# 4. 함수 생성/갱신
ENV="Variables={TO_EMAIL=$TO_EMAIL,FROM_EMAIL=$FROM_EMAIL,ALLOWED_ORIGINS=$ALLOWED_ORIGINS}"
if aws lambda get-function --region "$REGION" --function-name "$FN" >/dev/null 2>&1; then
  aws lambda update-function-code --region "$REGION" --function-name "$FN" --zip-file fileb://lambda.zip >/dev/null
  aws lambda wait function-updated --region "$REGION" --function-name "$FN"
  aws lambda update-function-configuration --region "$REGION" --function-name "$FN" --environment "$ENV" >/dev/null
else
  aws lambda create-function --region "$REGION" --function-name "$FN" --runtime nodejs20.x --handler index.handler \
    --role "$ROLE_ARN" --zip-file fileb://lambda.zip --timeout 10 --memory-size 256 --environment "$ENV" >/dev/null
  aws lambda wait function-active --region "$REGION" --function-name "$FN"
fi

# 5. Function URL (공개, CORS는 코드에서 처리)
aws lambda add-permission --region "$REGION" --function-name "$FN" --statement-id public-url \
  --action lambda:InvokeFunctionUrl --principal '*' --function-url-auth-type NONE >/dev/null 2>&1 || true
URL=$(aws lambda create-function-url-config --region "$REGION" --function-name "$FN" --auth-type NONE --query FunctionUrl --output text 2>/dev/null \
   || aws lambda get-function-url-config --region "$REGION" --function-name "$FN" --query FunctionUrl --output text)

echo
echo "Function URL: $URL"
echo "→ js/config.js 의 window.CONTACT_ENDPOINT 를 이 URL로 설정하세요."
echo "→ $FROM_EMAIL 메일함에서 'Amazon SES Address Verification' 메일의 링크를 클릭해야 발송이 됩니다."
