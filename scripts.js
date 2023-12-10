// Function to hide a specific stream and set a cookie
function hideStream(streamDivId) {
    const streamDiv = document.getElementById(streamDivId);
    if (streamDiv) {
        streamDiv.style.display = 'none';
        setHiddenStreamCookie(streamDivId);
    }
}

// Set cookie for hidden streams
function setHiddenStreamCookie(streamDivId) {
    document.cookie = `hidden_${streamDivId}=true; max-age=86400; path=/`;
}

// Function to show all streams in a grid layout
function showAllStreamsInGrid() {
    const streams = document.querySelectorAll('.stream');
    streams.forEach(stream => {
        stream.style.display = 'grid';
    });
}

// Function to create a Twitch embed for a given streamer
function createTwitchEmbed(streamer, container) {
    const embedDivId = 'twitch-embed-' + streamer;
    const streamDivId = 'stream-div-' + streamer;

    const streamDiv = document.createElement('div');
    streamDiv.id = streamDivId;
    streamDiv.className = 'stream';

    const streamHeader = document.createElement('h3');
    streamHeader.innerText = streamer;

    const embedDiv = document.createElement('div');
    embedDiv.id = embedDivId;
    embedDiv.className = 'twitch-embed';

    const hideButton = document.createElement('button');
    hideButton.innerText = 'Hide';
    hideButton.className = 'hide-button';
    hideButton.onclick = function() { hideStream(streamDivId); };

    streamDiv.appendChild(streamHeader);
    streamDiv.appendChild(embedDiv);
    streamDiv.appendChild(hideButton);

    container.appendChild(streamDiv);

    $(streamDiv).resizable({
        minHeight: 300,
        minWidth: 300,
        resize: function(event, ui) {
            $(this).find('.twitch-embed').each(function() {
                $(this).width(ui.size.width);
                $(this).height(ui.size.height - streamHeader.outerHeight(true) - hideButton.outerHeight(true));
            });
        }
    }).draggable({
        containment: 'body',
        scroll: false
    });

    new Twitch.Embed(embedDivId, {
        width: '100%',
        height: '100%',
        channel: streamer,
        parent: ["wheaties466.github.io"]
    });
}

// Function to render streams
function renderStreams(streamers) {
    const liveStreams = document.getElementById('live-streams');
    const offlineStreams = document.getElementById('offline-streams');

    liveStreams.innerHTML = '';
    offlineStreams.innerHTML = '';

    streamers.forEach(streamer => {
        createTwitchEmbed(streamer, liveStreams);
    });

    checkHiddenStreams();
}

// Check cookies on page load and hide streams if necessary
function checkHiddenStreams() {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name.startsWith('hidden_') && value === 'true') {
            const streamDivId = name.substring(7);
            hideStream(streamDivId);
        }
    });
}

// Fetch streamers from the text file, render streams, and set up periodic status check
fetch('streamers.txt')
    .then(response => response.text())
    .then(text => {
        const streamers = text.split('\n').filter(Boolean);
        renderStreams(streamers);
    })
    .catch(error => console.error('Error fetching streamers list:', error));

// Event listeners for the toggle buttons
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('show-live').addEventListener('click', function() {
        showAllStreamsInGrid();
        document.getElementById('live-streams').style.display = 'grid';
        document.getElementById('offline-streams').
