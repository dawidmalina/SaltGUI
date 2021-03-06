import {API} from './Api.js';
import {BeaconsMinionRoute} from './routes/BeaconsMinion.js';
import {BeaconsRoute} from './routes/Beacons.js';
import {CommandBox} from './CommandBox.js';
import {GrainsMinionRoute} from './routes/GrainsMinion.js';
import {GrainsRoute} from './routes/Grains.js';
import {JobRoute} from './routes/Job.js';
import {JobsRoute} from './routes/Jobs.js';
import {KeysRoute} from './routes/Keys.js';
import {LoginRoute} from './routes/Login.js';
import {MinionsRoute} from './routes/Minions.js';
import {OptionsRoute} from './routes/Options.js';
import {PillarsMinionRoute} from './routes/PillarsMinion.js';
import {PillarsRoute} from './routes/Pillars.js';
import {SchedulesMinionRoute} from './routes/SchedulesMinion.js';
import {SchedulesRoute} from './routes/Schedules.js';
import {TemplatesRoute} from './routes/Templates.js';

export class Router {

  constructor() {
    this.logoutTimer = this.logoutTimer.bind(this);

    this.api = new API();
    this.commandbox = new CommandBox(this.api);
    this.currentRoute = undefined;
    this.routes = [];

    this.registerRoute(new LoginRoute(this));
    this.registerRoute(new MinionsRoute(this));
    this.registerRoute(this.keysRoute = new KeysRoute(this));
    this.registerRoute(new GrainsRoute(this));
    this.registerRoute(new GrainsMinionRoute(this));
    this.registerRoute(new SchedulesRoute(this));
    this.registerRoute(new SchedulesMinionRoute(this));
    this.registerRoute(new PillarsRoute(this));
    this.registerRoute(new PillarsMinionRoute(this));
    this.registerRoute(new BeaconsRoute(this));
    this.registerRoute(this.beaconsMinionRoute = new BeaconsMinionRoute(this));
    this.registerRoute(this.jobRoute = new JobRoute(this));
    this.registerRoute(new JobsRoute(this));
    this.registerRoute(new TemplatesRoute(this));
    this.registerRoute(new OptionsRoute(this));

    // show template menu item if templates defined
    const templatesText = window.localStorage.getItem("templates");
    if(templatesText && templatesText !== "undefined") {
      const item1 = document.querySelector("#button-templates1");
      item1.style.display = "inline-block";
      const item2 = document.querySelector("#button-templates2");
      item2.style.display = "inline-block";
    }

    this._registerEventListeners();

    this.goTo(window.location.pathname + window.location.search);
  }

  _registerEventListeners() {
    document.querySelector(".logo")
      .addEventListener("click", pClickEvent => {
        if(window.location.pathname === "/login") return;
        if(window.event.ctrlKey) {
          window.location.assign("/options");
        } else {
          window.location.assign("/");
        }
      });

    document.querySelector("#button-minions1")
      .addEventListener("click", pClickEvent =>
        window.location.replace("/")
      );
    document.querySelector("#button-minions2")
      .addEventListener("click", pClickEvent =>
        window.location.replace("/")
      );

    document.querySelector("#button-grains1")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/grains")
      );
    document.querySelector("#button-grains2")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/grains")
      );

    document.querySelector("#button-schedules1")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/schedules")
      );
    document.querySelector("#button-schedules2")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/schedules")
      );

    document.querySelector("#button-pillars1")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/pillars")
      );
    document.querySelector("#button-pillars2")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/pillars")
      );

    document.querySelector("#button-beacons1")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/beacons")
      );
    document.querySelector("#button-beacons2")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/beacons")
      );

    document.querySelector("#button-keys1")
      .addEventListener("click", pClickEvent =>
        window.location.replace("/keys")
      );
    document.querySelector("#button-keys2")
      .addEventListener("click", pClickEvent =>
        window.location.replace("/keys")
      );

    document.querySelector("#button-jobs1")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/jobs")
      );
    document.querySelector("#button-jobs2")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/jobs")
      );

    document.querySelector("#button-templates1")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/templates")
      );
    document.querySelector("#button-templates2")
      .addEventListener('click', pClickEvent =>
        window.location.replace("/templates")
      );

    document.querySelector("#button-logout1")
      .addEventListener("click", pClickEvent => {
        this.api.logout().then(
          _ => window.location.replace("/login?reason=logout"));
      });
    document.querySelector("#button-logout2")
      .addEventListener("click", pClickEvent => {
        this.api.logout().then(
          _ => window.location.replace("/login?reason=logout"));
      });

    // don't verify the session too often
    setInterval(this.logoutTimer, 60000);
  }

  logoutTimer() {
    // are we logged in?
    const token = window.sessionStorage.getItem("token");
    if(!token) return;

    // just a random lightweight api call
    const wheelConfigValuesPromise = this.api.getWheelConfigValues();
    // don't act in the callbacks
    // Api.apiRequest will do all the work
    wheelConfigValuesPromise.then(data => { }, data => { });
  }

  registerRoute(pRoute) {
    this.routes.push(pRoute);
    if(pRoute.onRegister) pRoute.onRegister();
  }

  goTo(pPath) {
    if(this.switchingRoute) return;
    if(window.location.pathname === pPath && this.currentRoute) return;
    for(const route of this.routes) {
      if(!route.getPath().test(pPath.split("?")[0])) continue;
      // push history state for login (including redirect to /)
      if(pPath === "/login" || pPath === "/") window.history.pushState({}, undefined, pPath);
      this.showRoute(route);
      return;
    }
    // route could not be found
    // just go to the main page
    this.goTo("/");
  }

  showRoute(pRoute) {
    const myThis = this;

    pRoute.getPageElement().style.display = "";

    const minionMenuItem = document.getElementById("button-minions1");
    const jobsMenuItem = document.getElementById("button-jobs1");

    const activeMenuItems = Array.from(document.querySelectorAll(".menu-item-active"));
    activeMenuItems.forEach(
      function (e){ e.classList.remove("menu-item-active"); }
    );

    const elem1 = pRoute.getMenuItemElement1();
    if(elem1) {
      elem1.classList.add("menu-item-active");
      // activate also parent menu item if child element is selected
      if(elem1.id === "button-pillars1" ||
         elem1.id === "button-schedules1" ||
         elem1.id === "button-grains1" ||
         elem1.id === "button-beacons1") {
        minionMenuItem.classList.add("menu-item-active");
      }
      if(elem1.id === "button-jobs1" ||
         elem1.id === "button-templates1") {
        jobsMenuItem.classList.add("menu-item-active");
      }
    }

    const elem2 = pRoute.getMenuItemElement2();
    if(elem2) {
      elem2.classList.add("menu-item-active");
    }

    this.switchingRoute = true;

    pRoute.onShow();

    // start the event-pipe (again)
    // it is either not started, or needs restarting
    this.api.getEvents(this);

    if(myThis.currentRoute) {
      myThis.hideRoute(myThis.currentRoute);
    }

    myThis.currentRoute = pRoute;
    myThis.currentRoute.getPageElement().className = "route current";
    myThis.switchingRoute = false;
  }

  hideRoute(pRoute) {
    pRoute.getPageElement().className = "route";
    setTimeout(function() {
      // Hide element after fade, so it does not expand the body
      pRoute.getPageElement().style.display = "none";
    }, 500);
    if(pRoute.onHide) pRoute.onHide();
  }

}
