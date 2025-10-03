# Quiztopia API (Serverless)

Ett litet serverlöst HTTP-API på **AWS** med **Serverless Framework**.  
Funktioner: **auth (JWT)**, **quiz-CRUD**, **frågor** (lat/lon), **leaderboard**.

## Arkitektur (kort)
- **API:** AWS HTTP API v2 → varje endpoint är en **Lambda**
- **Runtime/Region/Stage:** Node.js 20 · `eu-north-1` · `dev`
- **Databas:** DynamoDB (single-table) + **GSI1** för leaderboard
- **Middleware:** Middy (JSON-parsing, CORS, fel)
- **Auth:** JWT (HS256), hemlighet via env/SSM
- **Bygg & loggar:** esbuild + CloudWatch

## Krav
- Node.js 20+
- AWS-konto och konfigurerade credentials
- Serverless Framework (globalt eller via npx)

## Kom igång
```bash
npm install

aws ssm put-parameter \
  --name "/quiztopia/dev/JWT_SECRET" \
  --value "byt_mig_till_något_starkt_eller_vad_du_vill" \
  --type "SecureString" \
  --overwrite

npm run build
npm run deploy

Importera insomnia-quiztopia.json i Insomnia:
Application → Import/Export → Import Data → From File → välj insomnia-quiztopia.json
Environment: sätt baseUrl = https://<api-id>.execute-api.eu-north-1.amazonaws.com
token (lämna tom tills du loggat in)
quizId (sätt efter att du skapat ett quiz)