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
    document.cookie = `hidden_${streamDivId}=${isHidden}; max-age=604800; path=/`;
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
function addStream(streamName) {
    createTwitchEmbed(streamName, document.getElementById('live-streams'));
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
        addStream(this.value);
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
        }
    });

    $('.stream').droppable({
        accept: '.stream',
        drop: function(event, ui) {
            var draggedId = ui.draggable.attr('id');
            var droppedOnId = $(this).attr('id');
            reorderStreams(draggedId, droppedOnId);

            var draggedElement = ui.draggable;
            var dropTargetIndex = $(event.target).children().index(ui.helper);
            handleStreamDrop(draggedElement, dropTargetIndex);
            saveStreamOrder();
        }
    });
}

// Reorder streams
function reorderStreams(draggedId, droppedOnId) {
    var draggedElement = $('#' + draggedId);
    var droppedOnElement = $('#' + droppedOnId);
    $(droppedOnElement).before(draggedElement.detach());

// Handle stream drop
function handleStreamDrop(draggedElement, dropTargetIndex) {
    var allStreams = $('#live-streams').children('.stream');
    if (dropTargetIndex >= allStreams.length) {
        $('#live-streams').append(draggedElement);
    } else {
        $(allStreams[dropTargetIndex]).before(draggedElement.detach());
    }
}

// Save stream order to localStorage
function saveStreamOrder() {
    var order = $('.stream').map(function() {
        return this.id;
    }).get();
    localStorage.setItem('stream_order', JSON.stringify(order));
}

// Load stream order from localStorage
function loadStreamOrder() {
    var order = JSON.parse(localStorage.getItem('stream_order'));
    if (order) {
        order.forEach(function(streamId) {
            var streamElement = $('#' + streamId);
            $('#live-streams').append(streamElement);
        });
    }
}

// Call makeStreamsDraggable and loadStreamOrder in renderStreams after streams are added
