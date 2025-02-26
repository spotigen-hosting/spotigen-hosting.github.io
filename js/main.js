let artistList = [];
let playlist = [];

appURL = "https://evanokeefe.com";

document.getElementById("text_input").addEventListener("keypress", async function(event) {
    if (event.key === "Enter") {
        let inputText = event.target.value;
        event.target.value = ""; 
        if(inputText.toUpperCase() == "SHIT"){
            await addArtist("Taylor Swift");
        }
        else{
            await addArtist(inputText);
        }
        
    }
});

document.getElementById("generate").addEventListener("click",  function() {
    generate();
});

async function main() {
    if (sessionStorage.getItem("accessToken") == undefined) {
        document.location = "/login.html";
        return;
    }
    let profile = await getProfile();
    ui(profile);
}

function ui(profile) {
    document.getElementById("title").innerHTML = `Welcome, ${profile.display_name}`;
    document.getElementById("pfp").src = profile.images[1].url;
    document.getElementById("pfp").addEventListener("click", async function() {
        window.open(profile.external_urls.spotify, '_blank').focus();
    });
    document.getElementById("logout").addEventListener("click", async function() {
        sessionStorage.removeItem("accessToken");
        document.location = "/index.html";
    });
}

async function getProfile() {
    let result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`}
    });

    if (!result.ok) {
        let e = await result.text();
        console.error("Error fetching profile:", e);
        return null;
    }

    return await result.json();
}

async function addArtist(name){
    let artist = await searchArtist(name);

    for (let i = 0; i < artistList.length; i++){
        if (artistList[i].id == artist.id){
            alert("Artist already added");
            return;
        }
    }

    artistList.push(artist);

    //Artist Div
    let artistDiv = document.createElement("div");
    artistDiv.id = "artist";

    //Remove Button
    let removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.id = "remove_button";
    removeButton.addEventListener("click", function() {
        artistDiv.style.transition = "opacity 0.5s ease-in-out";
        artistDiv.style.opacity = "0";
        setTimeout(() => {
            artistList = artistList.filter(id => id !== artist.id);
            artistDiv.remove();
        }, 500);

        for (let i = 0; i < artistList.length; i++){
            if (artistList[i].id == artist.id){
                artistList.splice(i, 1);
            }
        }
    });
    artistDiv.appendChild(removeButton);

    //Settings Button
    let settingsButton = document.createElement("button");
    settingsButton.textContent = "⚙";
    settingsButton.id = "settings_button";
    settingsButton.addEventListener("click", function() {
        settings(artist);
        var oldB = document.getElementById("close_settings");
        var newB = oldB.cloneNode(true);
        newB.addEventListener("click", function() {
            closeSettings(artist);
        });
        oldB.parentNode.replaceChild(newB, oldB);
    });
    artistDiv.appendChild(settingsButton);

    //Image
    if (artist.image) {
        let artistImage = document.createElement("img");
        artistImage.src = artist.image;
        artistImage.alt = artist.name;
        artistDiv.appendChild(artistImage);
        artistImage.width = 100;
        artistImage.height = 100;
    }

    //Name
    let nameText = document.createElement("h2");
    nameText.textContent = artist.name;
    nameText.addEventListener("click", function() {
        window.open(artist.url, '_blank').focus();
    })
    artistDiv.appendChild(nameText);

    //Genres
    let genreText = document.createElement("h3");
    genreText.textContent = artist.genres.map(genre => genre.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')).join(", ");
    artistDiv.appendChild(genreText);

    document.getElementById("artists").appendChild(artistDiv);

}

async function searchArtist(name) {

    let url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist`; //&limit=1

    let response = await fetch(url, {
        headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
    });

    let data = await response.json();
    
    if (!data.artists || data.artists.items.length === 0) {
        return null;
    }

    let distances = []
    let ind = 0;
    for (let i = 0; i < data.artists.items.length; i++) {
        let a = data.artists.items[i];

        distances[i] = levenshtein(name, a.name);
        if (distances[i] < ind) {
            ind = distances[i]
        }
    }

    let artist = data.artists.items[ind];
    return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        url: artist.external_urls.spotify,
        image: artist.images.length > 0 ? artist.images[0].url : null,
        mostPopular: true,
        random: false,
        similarArtists: false,
        similarGenres: false,
        mostRecent: false,
        featuredOn: false
    };
}

async function settings(artist) {
    let artistInList;
    for (let i = 0; i < artistList.length; i++){
        if (artistList[i].id == artist.id){
            artistInList = artistList[i];
        }
    }

    if(artistInList == undefined){
        console.error("You fucked up :)");
        return;
    }

    document.getElementById("settings_title").innerHTML = "Settings For: " + artistInList.name;
    document.getElementById("settings_photo").src = artistInList.image;

    document.getElementById("most_popular").checked = artistInList.mostPopular;
    document.getElementById("random").checked = artistInList.random;
    document.getElementById("similar_artists").checked = artistInList.similarArtists;
    document.getElementById("same_genre").checked = artistInList.similarGenres;
    document.getElementById("most_recent").checked = artistInList.mostRecent;
    document.getElementById("featured").checked = artistInList.featuredOn;
    
    document.getElementById("settings_popup").style.display = "block";
}

async function closeSettings(artist) {
    let i = 0;
    for (let ii = 0; ii < artistList.length; ii++){
        if (artistList[ii].id == artist.id){
            i = ii;
        }
    }
    
    artistList[i].mostPopular = document.getElementById("most_popular").checked;
    artistList[i].random = document.getElementById("random").checked;
    artistList[i].similarArtists = document.getElementById("similar_artists").checked;
    artistList[i].similarGenres = document.getElementById("same_genre").checked;
    artistList[i].mostRecent = document.getElementById("most_recent").checked;
    artistList[i].featuredOn = document.getElementById("featured").checked;

    
    document.getElementById("settings_popup").style.display = "none";
}

function levenshtein(s, t) {
    if (s === t) {
        return 0;
    }
    var n = s.length, m = t.length;
    if (n === 0 || m === 0) {
        return n + m;
    }
    var x = 0, y, a, b, c, d, g, h;
    var p = new Uint16Array(n);
    var u = new Uint32Array(n);
    for (y = 0; y < n;) {
        u[y] = s.charCodeAt(y);
        p[y] = ++y;
    }

    for (; (x + 3) < m; x += 4) {
        var e1 = t.charCodeAt(x);
        var e2 = t.charCodeAt(x + 1);
        var e3 = t.charCodeAt(x + 2);
        var e4 = t.charCodeAt(x + 3);
        c = x;
        b = x + 1;
        d = x + 2;
        g = x + 3;
        h = x + 4;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || b < c) {
                c = (a > b ? b + 1 : a + 1);
            }
            else {
                if (e1 !== u[y]) {
                    c++;
                }
            }

            if (c < b || d < b) {
                b = (c > d ? d + 1 : c + 1);
            }
            else {
                if (e2 !== u[y]) {
                    b++;
                }
            }

            if (b < d || g < d) {
                d = (b > g ? g + 1 : b + 1);
            }
            else {
                if (e3 !== u[y]) {
                    d++;
                }
            }

            if (d < g || h < g) {
                g = (d > h ? h + 1 : d + 1);
            }
            else {
                if (e4 !== u[y]) {
                    g++;
                }
            }
            p[y] = h = g;
            g = d;
            d = b;
            b = c;
            c = a;
        }
    }

    for (; x < m;) {
        var e = t.charCodeAt(x);
        c = x;
        d = ++x;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || d < c) {
                d = (a > d ? d + 1 : a + 1);
            }
            else {
                if (e !== u[y]) {
                    d = c + 1;
                }
                else {
                    d = c;
                }
            }
            p[y] = d;
            c = a;
        }
        h = d;
    }

    return h;
}

async function generate() {

    let info = document.getElementById("generating_info");

    if (artistList.length == 0) {
        alert("Please add at least 1 artist before generating a playlist")
        return;
    }

    document.getElementById("generating_popup").style.display = "block";

    let songs = []
    for (let i = 0; i < artistList.length; i++) {
        let artist = artistList[i]
        info.innerHTML = JSON.stringify(artist);
        if (artist.mostPopular) {
            let url = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks`;

            let response = await fetch(url, {
                headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
            });

            let data = await response.json();
            
            for (let i = 0; i  < data.tracks.length; i++) {
                let track = data.tracks[i];
                info.innerHTML = JSON.stringify(track);
                songs.push({
                    id: track.id,
                    artist: track.artists[0].name,
                    explicit: track.explicit,
                    url: track.external_urls.spotify,
                    name: track.name,
                    uri: track.uri
                })
            }
        }
        if (artist.random) {
            let artistTracks = []
            let albumsUrl = `https://api.spotify.com/v1/artists/${artist.id}/albums`;

            let response = await fetch(albumsUrl, {
                headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
            });

            let albumsData = await response.json();

            for (let i = 0; i < albumsData.items.length; i++) {
                const album = albumsData.items[i];

                info.innerHTML = JSON.stringify(album);

                let songUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks`;

                let response = await fetch(songUrl, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
                });

                let songData = await response.json();

                for (let i = 0; i < songData.items.length; i++) {
                    let track = songData.items[i];

                    info.innerHTML = JSON.stringify(track);
                    
                    artistTracks.push({
                        id: track.id,
                        artist: track.artists[0].name,
                        explicit: track.explicit,
                        url: track.external_urls.spotify,
                        name: track.name,
                        uri: track.uri

                    })
                }
            }

            for (let i = 0; i < 10 && artistTracks.length > 0; i++) {
                let randomIndex = Math.floor(Math.random() * artistTracks.length);
                info.innerHTML = JSON.stringify(artistTracks[randomIndex]);
                songs.push(artistTracks[randomIndex]);
                artistTracks.splice(randomIndex, 1);
            }
        }
        if (artist.similarArtists) {
            nameForAPI = artist.name.replace(/ /g, "%20");

            let url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${nameForAPI}&api_key=5a3022c959707367d96e65e67dd21f1c&format=json`;

            let response = await fetch(url);

            let data = await response.json();

            let similarArtists = []
            for (let i = 0; i < data.similarartists.artist.length && i < 5; i++) {
                let curArtist = data.similarartists.artist[i];
                info.innerHTML = JSON.stringify(curArtist);
                similarArtists.push(await searchArtist(curArtist.name));
            }
            for (let i = 0; i < similarArtists.length; i++) {
                let curArtist = similarArtists[i];
                let url = `https://api.spotify.com/v1/artists/${curArtist.id}/top-tracks`;

                let response = await fetch(url, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
                });

                let data = await response.json();
            
                for (let i = 0; i < data.tracks.length && i < 2; i++) {
                    let track = data.tracks[i];
                    info.innerHTML = JSON.stringify(track);
                    songs.push({
                        id: track.id,
                        artist: track.artists[0].name,
                        explicit: track.explicit,
                        url: track.external_urls.spotify,
                        name: track.name,
                        uri: track.uri
                    })
                }
            }
        }
        if (artist.similarGenres) {
            let genreUrl = `https://api.spotify.com/v1/search?q=genre:"${artist.genres[0]}"&type=artist`;
            let response = await fetch(genreUrl, {
                headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
            });
            let genreData = await response.json();

            if(genreData.artists.items.length == 0){
                alert("Genre null");
            }
            else{
                for(let i = 0; i < 10 && genreData.artists.items.length > 0; i++){
                    let randomIndex = Math.floor(Math.random() * genreData.artists.items.length);
                    let randomArtist = genreData.artists.items[randomIndex];
                    
                    if(randomArtist.name == artist.name){
                        genreData.artists.items.splice(randomIndex, 1);
                        i--;
                    }
                    else{
                        let url = `https://api.spotify.com/v1/artists/${randomArtist.id}/top-tracks`;

                        let response = await fetch(url, {
                            headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
                        });
                    
                        let data = await response.json();
                    
                        for (let i = 0; i < data.tracks.length && i < 2; i++) {
                            let track = data.tracks[i];
                            info.innerHTML = JSON.stringify(track);

                            if (track.artists[0].name == artist.name) {
                                data.tracks.splice(i, 1);
                                i--;
                            }
                            else{
                                songs.push({
                                    id: track.id,
                                    artist: track.artists[0].name,
                                    explicit: track.explicit,
                                    url: track.external_urls.spotify,
                                    name: track.name,
                                    uri: track.uri
                                })
                            }
                        }
                    }
                }
            }
        }
        if (artist.mostRecent) {
            let albumsUrl = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&market=US&limit=5&offset=0`;

            let response = await fetch(albumsUrl, {
                headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
            });

            let albumsData = await response.json();

            let songsAdded = 0;

            for (let i = 0; i < albumsData.items.length; i++) {
                const album = albumsData.items[i];

                let songUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks`;

                let response = await fetch(songUrl, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
                });

                let songData = await response.json();
                
                for (let i = 0; i < songData.items.length; i++) {
                    if (songsAdded >= 20) {
                        continue;
                    }
                    const track = songData.items[i];
                    
                    songs.push({
                        id: track.id,
                        artist: track.artists[0].name,
                        explicit: track.explicit,
                        url: track.external_urls.spotify,
                        name: track.name,
                        uri: track.uri
                    })
                    songsAdded++;
                }
            }

        }
        if (artist.featuredOn) {
            let artistTracks = []
            let albumsUrl = `https://api.spotify.com/v1/artists/${artist.id}/albums`;

            let response = await fetch(albumsUrl, {
                headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
            });

            let albumsData = await response.json();

            for (let i = 0; i < albumsData.items.length; i++) {
                const album = albumsData.items[i];

                info.innerHTML = JSON.stringify(album);

                let songUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks`;

                let response = await fetch(songUrl, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}` }
                });

                let songData = await response.json();

                for (let i = 0; i < songData.items.length; i++) {
                    let track = songData.items[i];


                    if (track.artists[0].name != artist.name) {
                        artistTracks.push({
                            id: track.id,
                            artist: track.artists[0].name,
                            explicit: track.explicit,
                            url: track.external_urls.spotify,
                            name: track.name,
                            uri: track.uri
                        });
                    }
                }
            }
        }

        playlist = songs;
            
    }

    let profile = await getProfile();
    let playlistName = "Genify Playlist: "
    for (let i = 0; i < artistList.length; i++) {
        const artist = artistList[i];
        if (i == artistList.length - 1) {
            playlistName += artist.name
        }
        else{
            playlistName += artist.name + ", "
        }
    }

    const url = `https://api.spotify.com/v1/users/${profile.id}/playlists`;
    const data = {
        name: playlistName,
        description: "Playlist generated using " + appURL.split("/")[2] + ", a website built and designed by Evan O'Keefe to automatically generate spotify playlists.",
        public: false
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem("accessToken")}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        const playlist = await response.json();
        await fillPlaylist(playlist);
    } else {
        console.error('Failed to create playlist:', response);
    }
    document.getElementById("generating_popup").style.display = "none";
}

async function fillPlaylist(playlistObj) {
    const url = `https://api.spotify.com/v1/playlists/${playlistObj.id}/tracks`;

    const headers = {
        'Authorization': `Bearer ${sessionStorage.getItem("accessToken")}`,
        'Content-Type': 'application/json',
    };

    let songUris = [];

    for (let i = 0; i < playlist.length; i++) {
        const currentSong = playlist[i];
        
        console.log(currentSong.name + " " + currentSong.uri);

        songUris.push(currentSong.uri)
    }

    shuffle(songUris);

    console.log(songUris);
    const body = JSON.stringify({
        uris: songUris, 
        position: 0,
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });
    } catch (error) {
        console.error('Error adding songs to playlist:', error);
    }
}

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {

      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

main();
