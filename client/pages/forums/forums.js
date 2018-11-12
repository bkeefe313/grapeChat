var socket = io();
var loggedIn = localStorage.getItem("loggedIn");
var currentUser = localStorage.getItem("currentUser");

function setup() {    
    if(loggedIn && currentUser != ""){
        $('<a/>').text("You are logged in as " + currentUser).appendTo('#logged-in');
    } else {
        $('<a/>').text("You are not logged in and cannot post. To log in, go back to the Chat page.").appendTo('#logged-in');
        $('#post-title').prop('disabled', true);
        $('#post-content').prop('disabled', true);
        $('#post-confirm').prop('disabled', true);
    }
    
    $('#post-confirm').click(function () {
        var postContent = $('#post-content');
        var postTitle = $('#post-title');
        var content = postContent.val().trim();
        var title = postTitle.val().trim();

        if (loggedIn) {
            if (title.length > 0 && content.length > 0) {
                postContent.prop('disabled', true);
                postTitle.prop('disabled', true);
                $(this).hide();
                socket.emit('post-added', {
                    title: title,
                    author: currentUser,
                    content: content
                });
                console.log('post confirmed');
            }
        } else {
            $('<div/>').text("You are not logged in. Go to the Chat page to log in.").appendTo('#logged-in')
        }
    });

    socket.on('post-completed', function (data) {
        post(data.title, data.author, data.content);
    });
}

function post(title, author, content) {
    $('<div/>').text(title).appendTo('#posts-list');
    $('<div/>').text("posted by: " + author).appendTo('#posts-list');
    $('<div/>').text(content).appendTo('#posts-list');
}


function draw() {

}
