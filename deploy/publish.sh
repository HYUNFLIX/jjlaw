#!/usr/bin/env bash
# 사이트를 AWS Amplify Hosting에 배포 (zip 업로드 방식). 수정 후 이 스크립트만 실행하면 됨.
set -euo pipefail
cd "$(dirname "$0")/.."

REGION="${REGION:-ap-northeast-2}"
APP_NAME="jjlaw"
BRANCH="main"

APP_ID=$(aws amplify list-apps --region "$REGION" --query "apps[?name=='$APP_NAME'].appId | [0]" --output text)
if [ "$APP_ID" = "None" ] || [ -z "$APP_ID" ]; then
  APP_ID=$(aws amplify create-app --region "$REGION" --name "$APP_NAME" --platform WEB \
    --custom-rules '[{"source":"/<*>","target":"/index.html","status":"404-200"}]' \
    --query app.appId --output text)
  aws amplify create-branch --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --stage PRODUCTION >/dev/null
  echo "Amplify 앱 생성: $APP_ID"
fi

# 배포 패키지
rm -f site.zip
python - <<'PY'
import zipfile, os
files = ['index.html','photo.jpg'] + [os.path.join(d,f) for d in ('css','js','assets') for f in os.listdir(d)]
with zipfile.ZipFile('site.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in files: z.write(f, f.replace(os.sep,'/'))
print('packaged', len(files), 'files')
PY

aws amplify create-deployment --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" > .deploy.json
JOB_ID=$(python -c "import json;print(json.load(open('.deploy.json'))['jobId'])")
UPLOAD_URL=$(python -c "import json;print(json.load(open('.deploy.json'))['zipUploadUrl'])")
rm -f .deploy.json
curl -s -o /dev/null -T site.zip "$UPLOAD_URL"
aws amplify start-deployment --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" >/dev/null

echo -n "배포 중"
for i in $(seq 1 40); do
  S=$(aws amplify get-job --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" --query job.summary.status --output text)
  [ "$S" = "SUCCEED" ] && break; [ "$S" = "FAILED" ] && { echo " 실패"; exit 1; }
  echo -n "."; sleep 3
done
rm -f site.zip
DOMAIN=$(aws amplify get-app --region "$REGION" --app-id "$APP_ID" --query app.defaultDomain --output text)
echo; echo "배포 완료: https://$BRANCH.$DOMAIN"
