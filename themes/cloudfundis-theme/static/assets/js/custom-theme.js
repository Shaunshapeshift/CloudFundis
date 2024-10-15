
(function($) {
	
	"use strict";


	document.addEventListener("DOMContentLoaded", function() {
		var header = document.querySelector('.header');
		var lastScroll = window.pageYOffset || document.documentElement.scrollTop;
		var stickyThreshold = 500; // Adjust this value as needed
	
		window.addEventListener("scroll", function() {
			var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
	
			if (currentScroll > stickyThreshold) {
				header.classList.add("sticky");
			} else {
				header.classList.remove("sticky");
			}
	
			// Only remove the sticky class if scrolling up and we're below the threshold
			if (currentScroll <= stickyThreshold && currentScroll < lastScroll) {
				header.classList.remove("sticky");
			}
	
			lastScroll = currentScroll;
		});
	});


	const menu = document.querySelector(".menu");
	const menuMain = menu.querySelector(".menu-main");
	const goBack = menu.querySelector(".go-back");
	const menuTrigger = document.querySelector(".mobile-menu-trigger");
	const closeMenu = menu.querySelector(".mobile-menu-close");
	let subMenu;
	menuMain.addEventListener("click", (e) =>{
		if(!menu.classList.contains("active")){
			return;
		}
	  if(e.target.closest(".menu-item-has-children")){
		   const hasChildren = e.target.closest(".menu-item-has-children");
		 showSubMenu(hasChildren);
	  }
	});
	goBack.addEventListener("click",() =>{
		 hideSubMenu();
	})
	menuTrigger.addEventListener("click",() =>{
		 toggleMenu();
	})
	closeMenu.addEventListener("click",() =>{
		 toggleMenu();
	})
	document.querySelector(".menu-overlay").addEventListener("click",() =>{
		toggleMenu();
	})
	function toggleMenu(){
		menu.classList.toggle("active");
		document.querySelector(".menu-overlay").classList.toggle("active");
	}
	function showSubMenu(hasChildren){
	   subMenu = hasChildren.querySelector(".sub-menu");
	   subMenu.classList.add("active");
	   subMenu.style.animation = "slideLeft 0.5s ease forwards";
	   const menuTitle = hasChildren.querySelector("i").parentNode.childNodes[0].textContent;
	   menu.querySelector(".current-menu-title").innerHTML=menuTitle;
	   menu.querySelector(".mobile-menu-head").classList.add("active");
	}
	
	function  hideSubMenu(){  
	   subMenu.style.animation = "slideRight 0.5s ease forwards";
	   setTimeout(() =>{
		  subMenu.classList.remove("active");	
	   },300); 
	   menu.querySelector(".current-menu-title").innerHTML="";
	   menu.querySelector(".mobile-menu-head").classList.remove("active");
	}
	
	window.onresize = function(){
		if(this.innerWidth >991){
			if(menu.classList.contains("active")){
				toggleMenu();
			}
	
		}
	}
	
	
	
	
	$(document).ready(function () {
		$('.dropdown').children('a').append(function () {
		  return '<button type="button" class="btn expander"><i class="icon fa fa-angle-down"></i></button>';
		});
  
		$('.dropdown').children('ul').hide();
  
		$('.btn.expander').click(function () {
		  $(this).parent().parent().children('ul').slideToggle();
		  $(this).parent().toggleClass('current');
		  $(this).find('i').toggleClass('fa-angle-up fa-angle-down');
		  return false;
		});
	  });
	
	
	



	// Elements Animation
	if($('.wow').length){
		var wow = new WOW(
		  {
			boxClass:     'wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset:       0,          // distance to the element when triggering the animation (default is 0)
			mobile:       false,       // trigger animations on mobile devices (default is true)
			live:         true       // act on asynchronously loaded content (default is true)
		  }
		);
		wow.init();
	}
	
})(window.jQuery);