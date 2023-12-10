// Function to hide a specific stream and set a cookie
function hideStream(streamDivId) {
    const streamDiv = document.getElementById(streamDivId);
    if (streamDiv) {
        streamDiv.style.display = 'none';
        setHiddenStreamCookie(streamDivId, true);
    }
}

// Set or reset cookie for hidden streams
function setHiddenStreamCookie(streamDivId, isHidden) {
    document.cookie = `hidden_${streamDivId}=${isHidden}; max-age=604800; path=/`; // Expires in 7 days
}

// Function to show all streams in a grid layout
function showAllStreamsInGrid() {
    const streams = document.querySelectorAll('.stream');
    streams.forEach(stream => {
        stream.style.display = 'grid';
    });
}

// Function to unhide all streams
function unhideAllStreams() {
    const hiddenStreams = document.querySelectorAll('.stream');
    hiddenStreams.forEach(stream => {
        stream.style.display = 'grid';
        const streamId = stream.id;
        if (streamId) {
            setHiddenStreamCookie(streamId, false);
        }
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

    new Twitch.Embed(embedDivId, {
        width: 854,
        height: 480,
        channel: streamer,
        parent: ["wheaties466.github.io"]
    });
}

// Function to add a new stream
function addStream(streamNames) {
    streamNames.forEach(streamName => {
        createTwitchEmbed(streamName.trim(), document.getElementById('live-streams'));
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
    makeStreamsDraggable();
    loadStreamOrder();
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
document.getElementById('show-live').addEventListener('click', showAllStreamsInGrid);
document.getElementById('show-offline').addEventListener('click', showAllStreamsInGrid);
document.getElementById('show-hidden').addEventListener('click', unhideAllStreams);
document.getElementById('add-stream').addEventListener('click', function() {
    document.getElementById('stream-name').style.display = 'block';
    document.getElementById('stream-name').focus();
});
document.getElementById('stream-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        var streamNames = this.value.split('\n');
        addStream(streamNames);
        this.value = '';
        this.style.display = 'none';
    }
});

// Make streams draggable
function makeStreamsDraggable() {
    $('.stream').draggable({
        revert: 'invalid',
        start: function() {
            $(this).addClass('dragging');
        },
        stop: function() {
            $(this).removeClass('dragging');
        },
        grid: [10, 10]
    });

    $('.stream-container').droppable({
        accept: '.stream',
        tolerance: 'intersect',
        drop: function(event, ui) {
            var draggedElement = ui.draggable;
            var targetIndex = $(this).children().index(ui.helper);
            var draggedIndex = draggedElement.index();

            if (draggedIndex < targetIndex) {
                $(this).children().eq(targetIndex).after(draggedElement);
            } else {
                $(this).children().eq(targetIndex).before(draggedElement);
            }

            saveStreamOrder();
        }
    });
}

// Save stream order to a cookie
function saveStreamOrder() {
    var order = $('.stream').map(function() {
        return this.id;
    }).get();
    var orderString = order.join(',');
    document.cookie = `stream_order=${orderString}; max-age=604800; path=/`;
}

// Load stream order from a cookie
function loadStreamOrder() {
    var orderString = getCookie('stream_order');
    if (orderString) {
        var order = orderString.split(',');
        order.forEach(function(streamId) {
            var streamElement = $('#' + streamId);
            $('#live-streams').append(streamElement);
        });
    }
}

// Helper function to get a cookie value
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

// Event listener for reset layout button
document.getElementById('reset-layout').addEventListener('click', resetStreamOrder);
