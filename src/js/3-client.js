var socket = io();
  
var $bucketTable = $('#bucket-table');
var $objectTable = $('#object-table');
var $metadataTable = $('#metadata-table');
var $createBucketForm = $("#create-bucket-form");
var $createBucketSubmitButton = $('#create-bucket-submit-button');
var $uploadObjectForm = $('#upload-object-form');
var $uploadObjectButton = $('#upload-object-button');
var $console = $('#console-display');

var createBucketWindow = null;
var uploadObjectWindow = null;

$bucketTable.on('click', '.delete-bucket-button', function(event) {
  event.preventDefault();
  var bucketName = $(this).attr("data");
  socket.emit('deleteBucket', {
    bucket: bucketName
  });
});

$bucketTable.on('click', '.empty-bucket-button', function(event) {
  event.preventDefault();
  var bucketName = $(this).attr("data");
  socket.emit('emptyBucket', {
    bucket: bucketName
  });
});

$("#create-bucket-open-form-button").on('click', function() {
  $createBucketSubmitButton.attr('value', 'Create Bucket');
  if (!createBucketWindow) {// First time...
    createBucketWindow = $.featherlight('#create-bucket-form', { 
      'persist' : true 
    });
  } else {// After that...
    createBucketWindow.open();
  }
});

$createBucketForm.on("submit", function(event) {
  event.preventDefault();
  var bucketName = $(this).find('#create-bucket-name-input').val();
  $createBucketSubmitButton.attr('value', 'Creating Bucket');
  socket.emit('createBucket', {
    bucket: bucketName
  });
});

$bucketTable.on("click", '.list-objects-link', function(event) {
  event.preventDefault();
  var bucketName = $(this).attr("data");

  socket.emit('listObjects', {
    bucket: bucketName
  });
});

$('#upload-object-open-form-button').on('click', function() {
  var dataAttr = $objectTable.attr('data');
  if (typeof dataAttr !== typeof undefined && dataAttr !== false) {
    $uploadObjectButton.attr('value', "Upload Object");
    if (!uploadObjectWindow) {// First time...
      uploadObjectWindow = $.featherlight('#upload-object-form', { 
        'persist' : true 
      });
    } else {// After that...
      $uploadObjectForm.find('#file-selected').html('');
      uploadObjectWindow.open();
    }
  } else {
    $console.append("Please select a bucket<br>");
    $console.scrollTop($console.prop("scrollHeight"));
  }
});

$uploadObjectForm.find('#fileChooser').on('change', function(event) {
  var fileName = ''; 
  fileName = $(this)[0].files[0].name; 
  $(this).siblings('#file-selected').html(fileName); 
});

$uploadObjectForm.on('submit', function(event) {
  event.preventDefault();
  $(this).ajaxSubmit({
    beforeSubmit: function() {
      $uploadObjectButton.attr('value', "Uploading");
    },
    error: function(xhr) {
      console.log(xhr.status);
    },
    success: function(response) {
    }
  });
});

$objectTable.on("click", ".show-metadata-link", function(event) {
  event.preventDefault();
  var bucketName = $objectTable.attr("data");
  $objectTable.find("tr").removeClass("selected");
  $(this).closest("tr").addClass('selected');
  var objectName = $(this).closest("tr").attr("data");
  socket.emit('getMetadata', {
    bucket: bucketName,
    object: objectName
  });
});

$objectTable.on("click", ".delete-object-button", function(event) {
  event.preventDefault();
  var bucketName = $objectTable.attr("data");
  var objectName = $(this).closest("tr").attr("data");
  socket.emit('deleteObject', {
    bucket: bucketName,
    object: objectName
  });
});

socket.on('connect', function () {
  socket.emit('listBuckets');
});

socket.on('console', function (data) {
  if (jQuery.type(data.message) === 'object') {
    data.message = "<pre>" + JSON.stringify(data.message, null, 2) + "</pre>";
  } else {
    data.message+="<br>";
  }
  $console.append(data.message);
  $console.scrollTop($console.prop("scrollHeight"));
});

socket.on('buckets', function (data) {
  clearBucketList();
  var html = '';   
  $.each(data.buckets, function (i, bucket) {
    html += '<tr><td><a class="list-objects-link" href="#" data="'+bucket.Name+'">' + bucket.Name + '</a></td><td class="button-cell"><button class="empty-bucket-button" data="'+bucket.Name+'">Empty</button><button class="delete-bucket-button" data="'+bucket.Name+'">Delete</button></td></tr>';
    // html += '<tr><td><a class="list-objects-link" href="#" data="'+bucket.Name+'">' + bucket.Name + '</a></td><td>' + bucket.CreationDate + '</td><td><button class="delete-bucket-button" data="'+bucket.Name+'">X</button><button class="empty-bucket-button" data="'+bucket.Name+'">Empty</button></td></tr>';
  });
  $bucketTable.append(html);
  var currentBucket = $objectTable.attr("data");
  $bucketTable.find('.list-objects-link[data="'+currentBucket+'"]').closest('tr').addClass('selected');
});

socket.on('createBucketComplete', function(data) {
  $createBucketSubmitButton.attr('value', 'Complete');
  $.featherlight.current().close();
});

socket.on('renderObjects', function (data) {
  listObjects(data);
});

socket.on('renderMetadata', function(data) {
  clearMetadataList();
  var html = '';   
  for(var i in data.metadata){
    html += '<tr><td>'+ i +'</td><td>' + data.metadata[i] + '</td></tr>';
  }
  $metadataTable.append(html);
});

socket.on('uploadComplete', function(data) {
  var bucketName = $objectTable.attr("data");
  socket.emit('listObjects', {
    bucket: bucketName
  });
  socket.emit('getMetadata', {
    bucket: bucketName,
    object: data.object
  });
  $uploadObjectButton.attr('value', "Complete");
  uploadObjectWindow.close();
});

function clearBucketList() {
  $bucketTable.find('tr:not(#bucket-table-headings)').remove();
}

function clearObjectList() {
  $objectTable.find('tr:not(#object-table-headings)').remove();
}

function clearMetadataList() {
  $metadataTable.find('tr:not(#metadata-table-headings)').remove();
}


function listObjects(data) {
  clearObjectList();
  clearMetadataList();
  $uploadObjectForm.attr("action", location.href+"uploadObject?bucket="+data.objects.Name);
  $bucketTable.find("tr").removeClass("selected");
  $bucketTable.find('.list-objects-link[data="'+data.objects.Name+'"]').closest('tr').addClass("selected");
  $objectTable.attr("data", data.objects.Name);
  $("#objects-in-bucket").text(" in "+data.objects.Name);

  var html = '';   
  $.each(data.objects.Contents, function (i, object) {
    // html += '<tr data="'+object.Key+'"><td><a class="show-metadata-link">'+object.Key+'</a></td><td>'+object.LastModified+'+</td><td class="button-cell"><button class="delete-object-button">Delete</button></td></tr>';
    html += '<tr data="'+object.Key+'"><td><a href="#" class="show-metadata-link">'+object.Key+'</a></td><td class="button-cell"><button class="delete-object-button">Delete</button></td></tr>';
  });
  $objectTable.append(html);
}

// $(document).bind('ajaxStart', function(){
//   $('#loading').show();
// }).bind('ajaxStop', function(){
//   $('#loading').hide();
// });