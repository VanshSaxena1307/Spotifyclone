console.log("JavaScript Started");

let currentsong = new Audio();
let songs = [];
let currFolder = "";
let volumeHideTimeout;

const play = document.querySelector("#play");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const hamburger = document.querySelector(".hamburger");
const closeIcon = document.querySelector(".close-icon");
const sidebar = document.querySelector(".left");
const volumeIcon = document.querySelector('.volume-icon');
const volumeSlider = document.querySelector('.volume-slider');
const songUL = document.querySelector(".songlist ul");
const cardcontainer = document.querySelector(".cardcontainer");

// Format time helper
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedSecs = secs < 10 ? "0" + secs : secs;
    return `${mins}:${paddedSecs}`;
}

// Get songs from selected folder
async function getsongs(folder) {
    console.log("Trying to fetch from:", `/songs/${folder}/`);

    currFolder = folder;
    let res = await fetch(`/${folder}/`);


    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;

    let links = div.getElementsByTagName("a");
    songs = [];

    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            songs.push(link.href.split(`/${folder}/`)[1]);

        }

    }
}

// Play a song
const playMusic = (track, pause = false) => {
    currentsong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentsong.play();
        play.src = "images/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Display albums dynamically
async function displayAlbums() {
    let res = await fetch(`/songs/`);
    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;

    let links = div.getElementsByTagName("a");

    for (let link of links) {
        if (link.href.includes("/songs")) {
            let folder = link.href.split("/").slice(-2)[0];

            // fetch album info
            try {
                let meta = await fetch(`/songs/${folder}/info.json`);
                let info = await meta.json();

                cardcontainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <img src="/songs/${folder}/cover.jpg" alt="${info.title}">
            <h3>${info.title}</h3>
            <p style="font-size: 14px;">${info.description}</p>
          </div>`;
            } catch (err) {
                console.warn(`Skipping folder "${folder}" (missing info.json)`);
            }
        }
    }

    // Card click listeners
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            let folder = card.dataset.folder;
            await getsongs(`songs/${folder}`);
            console.log("Trying to fetch from:", `/songs/${folder}/`);


            songUL.innerHTML = "";
            for (const song of songs) {
                songUL.innerHTML += `
          <li>
            <img src="images/music.svg" class="invertsvg" alt="">
            <div class="info">
              <div>${song.replaceAll("%20", " ")}</div>
              <div>Vansh</div>
            </div>
            <div class="playnow">
              <span>Play Now</span>
              <img src="images/play.svg" class="invertsvg" alt="">
            </div>
          </li>`;
            }

            document.querySelectorAll(".songlist li").forEach(li => {
                li.addEventListener("click", () => {
                    playMusic(li.querySelector(".info").firstElementChild.innerHTML);
                });
            });

            playMusic(songs[0], true);
        });
    });
}

// Main function
async function main() {
    // Init volume
    volumeSlider.value = 50;
    currentsong.volume = 0.5;
    volumeSlider.style.background = `linear-gradient(to right, rgba(0, 255, 234, 1) 50%, rgba(0, 255, 234, 0.15) 50%)`;

    // Seekbar
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${formatTime(currentsong.currentTime)} / ${formatTime(currentsong.duration)}`;

        document.querySelector(".circle").style.left =
            (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    // Play/Pause
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "images/pause.svg";
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    // Prev / Next
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    // Sidebar toggle
    hamburger.addEventListener("click", () => {
        sidebar.style.left = "0";
        hamburger.style.display = "none";
        closeIcon.style.display = "block";
    });

    closeIcon.addEventListener("click", () => {
        sidebar.style.left = "-100%";
        closeIcon.style.display = "none";
        hamburger.style.display = "block";
    });

    // Volume control
    volumeIcon.addEventListener("click", () => {
        volumeSlider.style.display =
            volumeSlider.style.display === "block" ? "none" : "block";

        // Reset hide timeout if needed
        clearTimeout(volumeHideTimeout);
    });

    volumeSlider.addEventListener("input", () => {
        const value = volumeSlider.value;
        currentsong.volume = value / 100;

        volumeSlider.style.background = `linear-gradient(to right, rgba(0, 255, 234, 1) ${value}%, rgba(0, 255, 234, 0.15) ${value}%)`;

        clearTimeout(volumeHideTimeout);
        volumeHideTimeout = setTimeout(() => {
            volumeSlider.style.display = "none";
        }, 3000);
    });

    // Auto-load default album on page load
    await getsongs("songs/2010-2015");

    // Fill sidebar
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
    <li>
      <img src="images/music.svg" class="invertsvg" alt="">
      <div class="info">
        <div>${song.replaceAll("%20", " ")}</div>
        <div>Vansh</div>
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img src="images/play.svg" class="invertsvg" alt="">
      </div>
    </li>`;
    }

    // Add event listeners to sidebar items
    document.querySelectorAll(".songlist li").forEach(li => {
        li.addEventListener("click", () => {
            playMusic(li.querySelector(".info").firstElementChild.innerHTML);
        });
    });

    currentsong.addEventListener("ended", () => {
        let currentIndex = songs.indexOf(currentsong.src.split("/").pop());

        if (currentIndex + 1 < songs.length) {
            // ✅ Play next song
            playMusic(songs[currentIndex + 1]);
        } else {
            // ✅ End of playlist — optional: stop or restart
            play.src = "images/play.svg";
        }
    });


    // Load first song in pause state
    playMusic(songs[0], true);

}

main();
displayAlbums();
