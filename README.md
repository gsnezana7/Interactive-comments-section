# Frontend Mentor - Interactive comments section solution

This is a solution to the [Interactive comments section challenge on Frontend Mentor](https://frontendmentor.io).

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
- [Author](#author)

## Overview

### The challenge

Users should be able to:

- View the optimal layout for the app depending on their device's screen size
- See hover states for all interactive elements on the page
- Create, Read, Update, and Delete comments and replies
- Upvote and downvote comments (scores dynamically update)
- **Bonus**: All comment data persists using `localStorage` after page refresh

### Screenshot

![](./screenshot.jpg)

### Links

- Solution URL: [GitHub Repository](https://github.com/gsnezana7/Interactive-comments-section)
- Live Site URL: [GitHub Pages Demo](https://gsnezana7.github.io/Interactive-comments-section/)

## My process

### Built with

- Semantic HTML5 markup
- CSS Custom Properties & Variables
- Flexbox & CSS Grid (`grid-template-areas` layout)
- Mobile-first workflow
- Vanilla JavaScript (Async/Await, DOM manipulation, Event Delegation)
- `localStorage` API for state persistence

### What I learned

During this project, I learned how to manage application state (`appData`) reactively using Vanilla JS. Implementing event delegation on a single container made managing dynamic CRUD operations (Create, Reply, Edit, Delete) incredibly clean and performant.

```js
// Reactive UI updates by changing the state first
appData.comments.push(newComment);
saveToLocalStorage();
renderComments();
```

## Author

- Frontend Mentor - [@gsnezana7](https://www.frontendmentor.io/profile/gsnezana7)
