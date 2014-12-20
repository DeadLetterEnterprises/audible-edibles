var index = 0;
var stepArray = new Array; 
var recognition = new webkitSpeechRecognition();

$(document).ready(function(){

	$('#search').keypress(function (e) {
		if (e.which == 13) {
			var terms = $('#search').val();
      search(terms);
			return false;
		}
	});
 
recognition.continuous = true;
recognition.onresult = listenForCommand;

});

function search(terms){
	$('#results').empty();
	$('#wrap').addClass('loading');
	$.ajax({
    type: 'GET',
    dataType: 'json',
    cache: false,
    url: 'http://api.bigoven.com/recipes',
    data: {
      any_kw: terms,
      api_key: 'dvxj3618B6VhQ8psqFCN3VHqvVX57cRt',
      pg: 1,
      rpp: 50
    },
    success: function(data){
      $.each(data.Results,function(){
        $('#results').append('' + 
        '<div class="result">' + 
          '<h2>' + this.Title + '</h2>' +
          '<p>' +
            '<img src="'+this.ImageURL+'" />' +
          '</p>' +
          '<p>' +
            '<a class="btn btn-lg btn-success" href="#" data-id="'+this.RecipeID+'">Start cooking &raquo;</a>' +
          '</p>' +
          '</div>' +
        '');
      });
      $('#results a').on('click',function(e){
        e.preventDefault();
        $('#wrap').addClass('loading');
        $.ajax({
          type: 'GET',
          dataType: 'json',
          cache: false,
          url: 'http://api.bigoven.com/recipe/'+$(this).data('id'),
          data: {
            api_key: 'dvxj3618B6VhQ8psqFCN3VHqvVX57cRt'
          },
          success: function(data){
            var instructions;
            if ( data.Instructions.indexOf('. ') === -1 ){
              instructions = data.Instructions.split(', ');
            } else {
              instructions = data.Instructions.split('. ');
            }
            var steps = '';
            $.each(instructions,function(i){
              stepArray.push(this);
              steps = steps + '<p class="step" data-index="'+i+'">' + this + '</p>';
            });
            $('#results').html('' + 
            '<div class="result">' + 
              '<h2>' + data.Title + '</h2>' +
              '<p>' +
                '<img src="'+data.ImageURL+'" />' +
              '</p>' +
              steps +
              '</div>' +
            '');
            speak(0);
          },
          error: function(error){ },
          complete: function(){
            $('#wrap').removeClass('loading');
          }
        });
        return false;
      });
    },
    error: function(error){
      console.log(error);
    },
    complete: function(){
  		$('#wrap').removeClass('loading');
    }
	});	
}
 
var listenForCommand = function(event) {
  // TODO: Find best guess instead of just first one
  var transcript = event.results[0][0].transcript;
  
  switch(transcript.toLowerCase()) {
    case "next":
    case "what's next":
      if(index = stepArray.length) {
        index = 'end';
      } else {
        index = index++;
      }
      break;
    case "previous":
    case "go back":
      if(index > 0) {
        index = index--;
      } else {
        index = 0;
      }
      break;
    case "start over":
      index = 0;
      break;
    case "repeat that":
      index = index;
      break;
    case "all done":
      index = 'end';
      break;
    default:
      index = 'error';
      break;
  }
 
  speak(index);
}
 
var speak = function(index) {
  $('#results .step').removeClass('active');
  $('#results .step').eq(index).addClass('active');
  if ( index === 'end' ) {
    pattern = "Bon apetit!";
  } else if ( index === 'error' ){
    pattern = "Could you repeat that?";
  } else {
    pattern = stepArray[index];
  }
  recognition.stop();
  var msg = new SpeechSynthesisUtterance(pattern);
  
  window.speechSynthesis.speak(msg);
  msg.onend = function(e) {
    recognition.start();
  };
}
