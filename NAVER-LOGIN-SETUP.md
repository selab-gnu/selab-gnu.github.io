# 네이버 로그인 활성화

현재 상태: 코드 구현 완료, 네이버 앱·서버·규칙 연결 전. Google 로그인은 계속 사용할 수 있습니다. `admin/naver-config.js`의 서버 주소가 비어 있으면 네이버 버튼은 준비 중이라고 안내합니다.

## 1. 네이버 앱 등록 (프로젝트 소유자)

https://developers.naver.com/apps/#/register 에서 로그인 앱을 등록합니다.
- 서비스 URL: `https://selab-gnu.github.io`
- Callback URL: `https://asia-northeast3-selab-fe241.cloudfunctions.net/naverLogin?action=callback`
- 앱의 개발/서비스 상태와 로그인 허용 사용자 설정을 확인합니다.
- 앱 Client ID는 설정값, Client Secret은 서버 비밀키입니다. 채팅·GitHub·프런트엔드에 비밀키를 넣지 않습니다.

## 2. 서버 배포 (프로젝트 소유자)

Firebase Cloud Functions 배포에는 Blaze 요금제 연결이 필요합니다. 요금제 변경은 이 작업에서 실행하지 않았습니다.

```
cd functions
npm install
cd ..
firebase login
firebase use selab-fe241
firebase functions:secrets:set NAVER_CLIENT_SECRET
firebase deploy --only functions:naverLogin
```

배포 시 NAVER_CLIENT_ID와 NAVER_CALLBACK_URL에 위 값을 입력합니다. 서비스 계정의 Firebase 사용자 관리와 커스텀 토큰 서명 권한이 필요합니다. 서명 권한 오류가 나면 해당 런타임 서비스 계정의 Service Account Token Creator 권한을 프로젝트 소유자가 확인합니다. 개인 서비스 계정 JSON 키를 저장소에 추가하지 않습니다.

## 3. 규칙 및 홈페이지 연결

1. 사용자가 게시하기로 한 `firestore.rules`를 Firebase 콘솔에서 게시합니다. Google 기존 권한은 유지하고, 서버가 발급한 네이버 신원만 추가 허용합니다.
2. `admin/naver-config.js`의 `naverLoginEndpoint`에 실제 배포된 HTTPS 함수 기본 URL을 입력합니다. query/action은 넣지 않습니다.
3. 홈페이지 코드를 배포합니다.
4. 네이버 앱에서 등록한 콜백 주소와 함수의 NAVER_CALLBACK_URL이 완전히 같아야 합니다. 서버는 고정된 `https://selab-gnu.github.io` 창으로만 결과를 전달합니다.

## 4. 권한 부여

네이버 계정으로 먼저 로그인하면 방문자로 표시되고 `naver_`로 시작하는 로그인 ID가 나옵니다. 그 ID를 기존 관리자에게 전달합니다. 관리자는 ‘계정 권한 관리’에서 Google 이메일 대신 해당 ID를 입력하고 관리자를 선택해 등록합니다. 새 네이버 관리자는 로그아웃 후 다시 로그인합니다.

네이버에서 사용하는 메일 주소만 입력하는 것으로는 권한이 부여되지 않습니다. 같은 이메일의 Google 계정과 자동 병합하지 않습니다. 최초 소유자 자동 권한은 기존의 검증된 Google 계정에만 적용됩니다.

## 보안 및 운영

OAuth state를 HttpOnly/Secure/SameSite=Lax 쿠키와 서버 서명·10분 만료로 검증합니다. 네이버 인증 코드는 서버에서만 토큰으로 교환하며 네이버 서버의 사용자 ID로 Firebase UID를 만듭니다. 비밀키·네이버 액세스 토큰은 클라이언트로 보내지 않습니다. Firebase 로그인 토큰은 고정 origin의 원래 팝업 창에 postMessage로 전달하며 URL에 넣지 않습니다. 클라이언트는 origin·팝업 source·state를 모두 확인합니다. 이메일 값이나 클라이언트 입력으로 권한을 생성하지 않습니다.

팝업 차단 시 허용 후 다시 시도합니다. 앱 비밀키 변경 시 Secret Manager 설정을 갱신하고 함수를 다시 배포합니다. 원래 네이버 앱을 바꾸면 네이버 사용자 식별자가 달라질 수 있으므로 기존 권한을 임의 승계하지 않습니다.

## 검증

`node --test functions/naver-core.test.js`로 state 위조·만료·신원 구분을 확인합니다. 실제 네이버 계정 로그인과 권한 확인은 위 설정 이후에 별도로 확인해야 합니다.

공식 문서: https://developers.naver.com/docs/login/devguide · https://firebase.google.com/docs/auth/admin/create-custom-tokens · https://firebase.google.com/docs/functions/get-started
