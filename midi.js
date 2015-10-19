var libsw = new LibSpaceWalk();

var midi;
var tweakableVariables;

// midi channel to control mapping
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
    "10": "slider10",
    "11": "slider11",
    "12": "slider12",
    "13": "slider13",
    "14": "slider14",
    "15": "slider15",
    "16": "slider16",
    "17": "slider17",
    "18": "slider18",
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
        var min = $('#' + id).slider('option', 'min');
        var max = $('#' + id).slider('option', 'max');
        $('#' + id).slider('value', linearMap(0, 127, min, max, value));
    }
}

function linearMap(a, b, r, s, value) {
    if (a == b)
    {
        if (value <= a)
        {
            return r;
        }
        else
        {
            return s;
        }
    }

    var ratio = (value - a) / (b - a);
    return r + (s - r) * ratio;
}


libsw.onMessage = function(data) {
	if (data.type === 'com.beyond35000.remote.list') {
        var controllerNumber = parseInt(data.payload.controllerNumber);
		tweakableVariables = [];

        data.payload.forEach(function(obj) {
            obj.fields.forEach(function(variable){
                    tweakableVariables.push({
                        objectName: obj.name,
                        variableName: variable.name,
                        value: variable.value,
                        min: variable.min,
                        max: variable.max
                    })
            })
        });

        tweakableVariables.forEach(function(element, index) {
            $('<option>', {
                text: element.objectName + '::' + element.variableName,
                'data-index': index,
                value: index
            }).appendTo('.control select');
        })

        // pre select variables
        var selects = $('select')
        for (var i = 0; i < tweakableVariables.length; i++) {
            $(selects[i]).val(i);
            $(selects[i]).change();
        }
	}
}

libsw.onSessionStarted = function() {
    $('option').remove();
    $('<option>', {
        text: '--'
    }).appendTo('select');

}

var sliderCallback = function(event, ui) {
    $(this).siblings('.value').text(ui.value);

    var index = $(this).data('index');
    if (index >= 0) {
        var variable = tweakableVariables[$(this).data('index')]
        var message = {
            type: 'com.beyond35000.remote.list',
            payload: [
                {
                    name: variable.objectName,
                    fields: [
                        {
                            name: variable.variableName,
                            type: 'single',
                            value: ui.value
                        }
                    ]
                 }
            ]
        };
        libsw.postMessage(message);
    }
}

$(document).ready(function() {

    $('.rangeSlider').slider({
        range: true,
        step: 0.001,
        slide: function(event, ui) {
            var slider = $(this).siblings('.slider');
            slider.slider({
                min: ui.values[0],
                max: ui.values[1],
            })
            $(this).siblings('.from').attr('value', ui.values[0]);
            $(this).siblings('.to').attr('value', ui.values[1]);
        }
    })

    for (var i = 1; i <= 18; i++) {
        $('#slider' + i).slider({
            min: 0,
            max: 127,
            value: 0,
            step: 0.001,
            change: sliderCallback,
            slide: sliderCallback
        });

        $('#select' + i).change(function() {
            if (this.selectedIndex != 0) {
                var index = $($(this).children()[this.selectedIndex]).data('index');
                var element = tweakableVariables[index];
                var absRange = element.max - element.min;

                var rangeSlider = $(this).siblings('.rangeSlider');
                rangeSlider.slider({
                    min: element.min - (2 * absRange),
                    max: element.max + (2 * absRange),
                    values: [element.min, element.max]
                })

                $(this).siblings('.value').text(element.value);
                $(this).siblings('.from').attr('value', element.min);
                $(this).siblings('.to').attr('value', element.max);

                var slider = $(this).siblings('.slider');
                slider.attr('data-index', index);
                slider.slider({
                    min: element.min,
                    max: element.max,
                    value: element.value
                })
            } else {
                $(this).siblings('div').attr('data-index', -1);
                $(this).siblings('.from').text('--');
                $(this).siblings('.to').text('--');
            }
        })
    }

    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex: false}).then(onMIDISuccess, onMIDIFailure);
    } else {
        alert("No MIDI support in your browser.");
    }

});
