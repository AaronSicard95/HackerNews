"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, fromMS) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  let heartClass;
  if(currentUser.favorites.some(i => i.storyId == story.storyId)){
    heartClass = "fa-solid fa-heart";
  }else{
    heartClass = "fa-regular fa-heart";
  }
  let trashB = fromMS ? `<i id="${story.storyId}-trashB" class="fa-sharp fa-regular fa-trash-can"></i>`:"";
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <span id="${story.storyId}-button" class="${heartClass}"></span>
        ${trashB}
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story, false);
    $allStoriesList.append($story);
    let but = $(`#${story.storyId}-button`);
    but.on('click', async function(evt){
      if(currentUser.favorites.some(i=>i.storyId==story.storyId)){
        await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}/favorites/${story.storyId}?token=${currentUser.loginToken}`);
        let newF = currentUser.favorites.filter(i=>i.storyId!=story.storyId);
        currentUser.favorites = newF;
        but.toggleClass("fa-solid fa-regular");
      }else{
        await axios.post(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}/favorites/${story.storyId}`,   {token: currentUser.loginToken});
        currentUser.favorites.push(story);
        but.toggleClass("fa-solid fa-regular");
      }
    })
  }

  $allStoriesList.show();
}

function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story,false);
    $allStoriesList.append($story);
    let but = $(`#${story.storyId}-button`);
    but.on('click', async function(evt){
      await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}/favorites/${story.storyId}?token=${currentUser.loginToken}`);
      $story.remove();
    })
  }

  $allStoriesList.show();
}
function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");

  $allStoriesList.empty();
  console.log(currentUser.ownStories);
  // loop through all of our stories and generate HTML for them
  for (let story of currentUser.ownStories) {
    const $story = generateStoryMarkup(story,true);
    $allStoriesList.append($story);
    let but = $(`#${story.storyId}-button`);
    but.on('click', async function(evt){
      await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}/favorites/${story.storyId}?token=${currentUser.loginToken}`);
    })
    but = $(`#${story.storyId}-trashB`);
    but.on('click', async function(evt){
      await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/stories/${story.storyId}?token=${currentUser.loginToken}`);
      $story.remove();
    })
  }

  $allStoriesList.show();
}

async function makeStory(evt) {
  console.debug("makeStory", evt);
  evt.preventDefault();

  // grab the username and password
  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  let newPost = await storyList.addStory(currentUser, {title:title, author:author,url:url});
  currentUser.ownStories.push(newPost);
  hidePageComponents();
  $allStoriesList.show();
  getAndShowStoriesOnStart();
}
$storyForm.on('submit', makeStory);