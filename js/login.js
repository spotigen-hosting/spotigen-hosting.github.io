const url = "https://evanokeefe.com";

let clientID = 'efc74990edc848b884ad44e7433ff771';
let params = new URLSearchParams(window.location.search);
let code = params.get("code");

async function main() {
    if (!code) {
        redirectToAuthCodeFlow(clientID);
    } 
    else {
        let accessToken = await getAccessToken(clientID, code);
        sessionStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("authed", true);
        document.location = "/main.html";
    }
}

async function redirectToAuthCodeFlow(clientID) {
    let verifier = generateCodeVerifier(128);
    let challenge = await generateCodeChallenge(verifier);

    sessionStorage.setItem("verifier", verifier);

    let params = new URLSearchParams();
    params.append("client_id", clientID);
    params.append("response_type", "code");
    params.append("redirect_uri", url + "/login.html");
    
    params.append("scope", "user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    let data = new TextEncoder().encode(codeVerifier);
    let digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getAccessToken(clientId, code) {
    let verifier = sessionStorage.getItem("verifier");

    let params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", url + "/login.html");
    params.append("code_verifier", verifier);

    let result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    let { access_token } = await result.json();
    sessionStorage.setItem("accessToken", access_token);
    return access_token;
}

main();