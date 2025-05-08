
  AOS.init({
    duration: 1000,
    offset: 100,
    once: true
  });


  // Mobile Menu Toggle
document.querySelector('.hamburger').addEventListener('click', () => {
  document.querySelector('.navbar-right').classList.toggle('active');
});

// Close menu on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar')) {
    document.querySelector('.navbar-right').classList.remove('active');
  }
});
  // FAQ Accordion Toggle
  document.querySelectorAll(".faq-item").forEach(item => {
    item.addEventListener("click", () => {
      const answer = item.querySelector(".faq-answer");
      const symbol = item.querySelector(".faq-question span:last-child");
      if (answer.style.display === "block") {
        answer.style.display = "none";
        symbol.textContent = "+";
      } else {
        answer.style.display = "block";
        symbol.textContent = "-";
      }
    });
  });

// Slider
const slidecontainer= document.querySelector(".slide-container");
const cardWrapper = document.querySelector(".card-wapper");
const arrowBtns = document.querySelectorAll(".slide-container i");
const firstcardwidth = cardWrapper.querySelector(".card").offsetWidth;
const cardWrapperChildern = [...cardWrapper.children];

let isDragging = false, startX, startScrollLeft, timeoutId;

let cardpreview = Math.round(cardWrapper.offsetWidth / firstcardwidth);

cardWrapperChildern.slice(-cardpreview).reverse().forEach(card => {
    cardWrapper.insertAdjacentElement("afterbegin", card.cloneNode(true));
});

cardWrapperChildern.slice(0 ,cardpreview).forEach(card =>{
    cardWrapper.insertAdjacentElement("beforeend", card.cloneNode(true));
});

arrowBtns.forEach(btn =>{
   btn.addEventListener("click",() =>{
     cardWrapper.scrollLeft += btn.id === "left" ? -firstcardwidth : firstcardwidth;
   });
});

const dragStart = (e) => {
    isDragging = true;
    cardWrapper.classList.add("dragging");
    startX = e.pageX;
    startScrollLeft = cardWrapper.scrollLeft;
}

const dragging = (e) => {
    if (!isDragging) return;
    cardWrapper.scrollLeft = startScrollLeft - (e.pageX - startX);
}

const dragStop = () => {
    isDragging = false;
    cardWrapper.classList.remove("dragging");
}

const autoplay = () =>{
    if(window.innerWidth < 800) return;
    timeoutId = setTimeout( () => cardWrapper.scrollLeft += firstcardwidth, 5000);
}

autoplay();

const infiniteScroll = () => {
    if(cardWrapper.scrollLeft === 0){
        cardWrapper.classList.add("no-transition");
        cardWrapper.scrollLeft =cardWrapper.scrollWidth - (2 * cardWrapper.offsetWidth);
        cardWrapper.classList.remove("no-transition");
    }else if(Math.ceil(cardWrapper.scrollLeft) === cardWrapper.scrollWidth - cardWrapper.offsetWidth){
        cardWrapper.classList.add("no-transition");
        cardWrapper.scrollLeft = cardWrapper.offsetWidth;
        cardWrapper.classList.remove("no-transition");
    }

    clearTimeout(timeoutId);
    if(!slidecontainer.matches(":hover")) autoplay();
}


cardWrapper.addEventListener("mousedown", dragStart);
cardWrapper.addEventListener("mousemove", dragging);
document.addEventListener("mouseup", dragStop);
cardWrapper.addEventListener("scroll", infiniteScroll);
slidecontainer.addEventListener("mouseenter", () => clearTimeout(timeoutId));
slidecontainer.addEventListener("mouseleave", autoplay);


// Improved Slider Touch Support
let touchStartX = 0;
let touchEndX = 0;

cardWrapper.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

cardWrapper.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > 50) {
    cardWrapper.scrollLeft += firstcardwidth;
  }
  if (touchEndX - touchStartX > 50) {
    cardWrapper.scrollLeft -= firstcardwidth;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("current-year").textContent = new Date().getFullYear();
});

