// Load the existing authorization module first. This also upgrades an older
// cached popup handler without creating a second authorization state instance.
import './auth.js';
import {app} from '../firebase-client.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {setupGoogleLogin} from './login-flow.js';

const auth=getAuth(app);
const flow=setupGoogleLogin({
 auth,
 provider:()=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return provider;},
 signInWithPopup,signInWithRedirect,getRedirectResult,
 login:document.getElementById('login'),redirect:document.getElementById('login-redirect'),status:document.getElementById('auth-status')
});
onAuthStateChanged(auth,user=>{flow.authChanged(user);document.getElementById('login-help').hidden=!!user;});
