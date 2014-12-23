$(document).ready(function(){

	$('#search').keypress(function(e) {
		if (e.which == 13) {
			var terms = encodeURIComponent($('#search').val());
      search(terms);
			return false;
		}
	});

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
      console.log(data);
      $.each(data.Results,function(){
        $('#results').append('' + 
        '<p class="result">' + 
          '<a href="#" data-id="'+this.RecipeID+'">' +
            '<span class="img-wrap"><img src="'+this.ImageURL+'" /></span> ' +
            '<span class="title">' + 
              this.Title + 
              '<span class="glyphicon glyphicon-play"></span>' +
            '</span>' +
          '</a>' +
        '</p>' +
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
            console.log(data);
            var instructions;
            if ( data.Instructions.indexOf('. ') === -1 ){
              instructions = data.Instructions.split(', ');
            } else {
              instructions = data.Instructions.split('. ');
            }
            var ingredients = '';
            $.each(data.Ingredients,function(){
              var quantity = this.DisplayQuantity ? this.DisplayQuantity : '';
              var unit = this.Unit ? this.Unit : '';
              if ( quantity > 1 && unit !== '' ){
                unit = this.Unit + 's';
              }
              ingredients = ingredients + '<p class="ingredient">' + quantity + ' ' + unit + ' ' + this.Name + '</p>';
            });
            var steps = '';
            var stepCount = 0;
            $.each(instructions,function(i){
              if ( isNaN(this) ){
                stepArray.push(this);
                steps = steps + '<p><a class="step" data-index="'+stepCount+'" href="#">' + this + '</a></p>';
                stepCount++;
              }
            });
            $('#results').html('' + 
            '<div class="recipe">' + 
              '<div class="header">' + 
                '<h2>' + data.Title + '</h2>' +
                '<span class="img-wrap"><img src="'+data.ImageURL+'" /></span>' +
              '</div>' +
              '<div class="ingredients">' +
                '<h3>Ingredients</h3>' +
                ingredients +
              '</div>' +
              '<div class="steps">' +
                '<h3>Steps</h3>' +
                steps +
              '</div>' +
            '</div>' +
            '');
            speak(0);
            $('#results .step').on('click',function(e){
              e.preventDefault();
              speak($(this).data('index'));
              return false;
            });
            $('html').on('keydown',function(e) {
              //TODO Why does this get triggered a billion times for each keypress?
              // e.preventDefault();
              // if (e.which === 38) {
              //   if(index > 0) {
              //     index = index--;
              //   } else {
              //     index = 0;
              //   }
              // }
              // if (e.which === 40) {
              //   if(index = stepArray.length) {
              //     index = 'end';
              //   } else {
              //     index = index++;
              //   }
              // }
              // console.log(index)
              // speak(index);
              // return false;
            });
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

var index = 0;
var stepArray = new Array; 
var recognition = new webkitSpeechRecognition();

recognition.continuous = true;
recognition.onresult = listenForCommand;

var listenForCommand = function(event) {

  // TODO: Find best guess instead of just first one
  var transcript = event.results[0][0].transcript;

  console.log(stepArray,index,transcript);

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

  console.log(index)
 
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
