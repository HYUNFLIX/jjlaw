# 배포 가이드

## 구성
- **호스팅**: AWS Amplify Hosting (앱 ID `d20m5woshwnwmo`, 서울 리전) — zip 업로드 방식
- **상담 폼**: Lambda `jjlaw-contact-mailer` (Function URL) → SES → kjjlawyer@gmail.com
- **AWS 계정**: 534347546901 (CLI 프로필 기본값)

## 사이트 수정 후 배포
```bash
bash deploy/publish.sh
```
임시 주소: https://main.d20m5woshwnwmo.amplifyapp.com

## Lambda 코드 수정 후
```bash
bash deploy/deploy.sh
```

## 최초 설정 시 1회 필요한 작업
1. kjjlawyer@gmail.com 메일함에서 "Amazon SES Address Verification" 링크 클릭
2. Amplify 콘솔 → 앱 → Hosting → Custom domains → jjlaw.co.kr 추가 → 안내된 CNAME을 가비아 DNS에 등록
