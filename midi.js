var libsw = new LibSpaceWalk();

var midi;

var mapping = {
    "1": "slider1",
    "2": "slider2",
    "3": "slider3",
    "4": "slider4",
    "5": "slider5",
    "6": "slider6",
    "7": "slider7",
    "8": "slider8",
    "9": "slider9",
}

// midi functions
function onMIDISuccess(midiAccess) {
    // when we get a succesful response, run this code
    console.log('MIDI Access Object', midiAccess);
    midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status

    var inputs = midi.inputs.values();
    // loop over all available inputs and listen for any MIDI input
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        input.value.onmidimessage = onMIDIMessage;
    }
}

function onMIDIFailure(e) {
    // when we get a failed response, run this code
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
}

function onMIDIMessage(message) {
    data = message.data; // this gives us our [command/channel, note, velocity] data.
    console.log('MIDI data', data); // MIDI data [144, 63, 73]
    var note = data[1];
    var value = data[2];
    var id = mapping[note];
    if (id) {
        $('#' + id).slider('value', value);
    }
}

$(document).ready(function() {
    for (var i = 1; i <= 9; i++) {
        $('#slider' + i).slider({
            min: 0,
            max: 127,
            value: 0
        });
    }

    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex: false}).then(onMIDISuccess, onMIDIFailure);
    } else {
        alert("No MIDI support in your browser.");
    }

});
