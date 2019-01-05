class PageRoute extends Route {

  constructor(path, name, page_selector, menuitem_selector, router) {
    super(path, name, page_selector, menuitem_selector, router);

    this._runCommand = this._runCommand.bind(this);
    this._updateJobs = this._updateJobs.bind(this);
    this._updateMinions = this._updateMinions.bind(this);

    if(PageRoute.hasMenu === undefined) {
      const hamburger_container = document.querySelector("#hamburger_container");
      const menu = new DropDownMenu(hamburger_container);
      menu.addMenuItem("minions", function(evt) {
        window.location.replace("/");
      });
      menu.addMenuItem("keys", function(evt) {
        window.location.replace("/keys");
      });
      menu.addMenuItem("grains", function(evt) {
        window.location.replace("/grains");
      });
      menu.addMenuItem("schedules", function(evt) {
        window.location.replace("/schedules");
      });
      menu.addMenuItem("pillars", function(evt) {
        window.location.replace("/pillars");
      });
      menu.addMenuItem("logout", function(evt) {
        const api = new API();
        api.logout().then(window.location.replace("/"));
      });
      PageRoute.hasMenu = true;
    }
  }

  _updateMinions(data) {
    const minions = data.return[0];

    const list = this.getPageElement().querySelector("#minions");
    const hostnames = Object.keys(minions).sort();

    // save for the autocompletion
    window.localStorage.setItem("minions", JSON.stringify(hostnames));

    for(const hostname of hostnames) {
      const minion_info = minions[hostname];

      // minions can be offline, then the info will be false
      if (minion_info === false) {
        this._updateOfflineMinion(list, hostname);
      } else {
        this._updateMinion(list, minion_info, hostname);
      }
    }
  }

  _getElement(container, id) {
    let element = document.getElementById(id);

    if(element === null) {
      // minion not found on screen...
      // construct a basic element that can be updated
      element = document.createElement("tr");
      element.id = id;
      container.appendChild(element);
      return element;
    }

    // remove existing content
    while(element.firstChild) {
      element.removeChild(element.firstChild);
    }

    return element;
  }

  _updateOfflineMinion(container, hostname) {
    const element = this._getElement(container, hostname);

    element.appendChild(Route._createTd("hostname", hostname));

    const offline = Route._createTd("status", "offline");
    offline.classList.add("offline");
    element.appendChild(offline);
  }

  _getBestIpNumber(minion) {
    if(!minion) return null;
    const ipv4 = minion.fqdn_ip4;
    if(!ipv4) return null;
    // either a string or something strange
    if(!Array.isArray(ipv4)) return ipv4;

    // so, it is an array

    // get the public IP number (if any)
    for(const s of ipv4) {
      // local = 127.0.0.0/8
      if(s.startsWith("127.")) continue;
      // private A = 10.0.0.0/8
      if(s.startsWith("10.")) continue;
      // private B = 172.16.0.0/20
      if(s.startsWith("172.16.")) continue;
      if(s.startsWith("172.17.")) continue;
      if(s.startsWith("172.18.")) continue;
      if(s.startsWith("172.19.")) continue;
      if(s.startsWith("172.20.")) continue;
      if(s.startsWith("172.21.")) continue;
      if(s.startsWith("172.22.")) continue;
      if(s.startsWith("172.23.")) continue;
      if(s.startsWith("172.24.")) continue;
      if(s.startsWith("172.25.")) continue;
      if(s.startsWith("172.26.")) continue;
      if(s.startsWith("172.27.")) continue;
      if(s.startsWith("172.28.")) continue;
      if(s.startsWith("172.29.")) continue;
      if(s.startsWith("172.30.")) continue;
      if(s.startsWith("172.31.")) continue;
      // private C = 192.168.0.0/16
      if(s.startsWith("192.168.")) continue;
      // not a local/private address, therefore it is public
      return s;
    }

    // no public IP number
    // get the private IP number (if any)
    for(const s of ipv4) {
      // local = 127.0.0.0/8
      if(s.startsWith("127.")) continue;
      // not a local address, therefore it is private
      return s;
    }

    // just pick the first one, should then be a local address
    return ipv4[0];
  }

  _updateMinion(container, minion, hostname) {

    const element = this._getElement(container, hostname);

    element.appendChild(Route._createTd("hostname", hostname));

    const ipv4 = this._getBestIpNumber(minion);
    if(ipv4) {
      const address = Route._createTd("status", ipv4);
      // ipnumbers do not sort well, reformat into something sortable
      const ipv4parts = ipv4.split(".");
      let sorttable_customkey = "";
      if(ipv4parts.length == 4) {
        // never mind adding '.'; this is only a sort-key
        for(let i = 0; i < 4; i++) sorttable_customkey += ipv4parts[i].padStart(3, "0");
        address.setAttribute("sorttable_customkey", sorttable_customkey);
      }
      address.classList.add("address");
      address.setAttribute("tabindex", -1);
      address.addEventListener("click", this._copyAddress);
      element.appendChild(address);
    } else {
      const accepted = Route._createTd("status", "accepted");
      accepted.classList.add("accepted");
      element.appendChild(accepted);
    }

    let saltversion = "---";
    if(minion && minion.saltversion) saltversion = minion.saltversion;
    if(minion) element.appendChild(Route._createTd("saltversion", saltversion));

    let os = "---";
    if(minion && minion.os && minion.osrelease) os = minion.os + " " + minion.osrelease;
    else if(minion && minion.os) os = minion.os;
    if(minion) {
      const td = Route._createTd("os", os);
      const img = document.createElement("img");
      img.setAttribute("src", "static/images/os-" + minion.os.toLowerCase() + ".png");
      img.classList.add("osimage");
      td.prepend(img);
      element.appendChild(td);
    }
  }

  _addMinion(container, hostname) {

    let element = document.getElementById(hostname);
    if(element !== null) {
      // minion already on screen...
      return;
    }

    element = document.createElement("tr");
    element.id = hostname;

    element.appendChild(Route._createTd("hostname", hostname));

    const minion = Route._createTd("status", "accepted");
    minion.classList.add("accepted");
    element.appendChild(minion);

    element.appendChild(Route._createTd("os", "loading..."));

    // fill out the number of columns to that of the header
    while(element.cells.length < container.tHead.rows[0].cells.length) {
      element.appendChild(Route._createTd("", ""));
    }

    container.tBodies[0].appendChild(element);
  }

  _addNone(container) {
    const tr = document.createElement("tr");
    const td = Route._createTd("hostname", "none");
    td.setAttribute("colspan", container.rows[0].cells.length);
    tr.appendChild(td);
    container.appendChild(tr);
  }

  _updateJobs(data) {
    const jobContainer = this.getPageElement().querySelector(".jobs");
    //jobContainer.innerText = "";
    const jobs = this._jobsToArray(data.return[0]);
    this._sortJobs(jobs);

    //Add seven most recent jobs
    let shown = 0;
    let i = 0;
    while(shown < 7 && jobs[i] !== undefined) {
      const job = jobs[i];
      i = i + 1;
      if(job.Function === "grains.append") continue;
      if(job.Function === "grains.delkey") continue;
      if(job.Function === "grains.delval") continue;
      if(job.Function === "grains.items") continue;
      if(job.Function === "grains.setval") continue;
      if(job.Function === "pillar.items") continue;
      if(job.Function === "pillar.obfuscate") continue;
      if(job.Function === "runner.jobs.active") continue;
      if(job.Function === "runner.jobs.list_job") continue;
      if(job.Function === "runner.jobs.list_jobs") continue;
      if(job.Function === "saltutil.find_job") continue;
      if(job.Function === "saltutil.refresh_grains") continue;
      if(job.Function === "saltutil.refresh_pillar") continue;
      if(job.Function === "saltutil.running") continue;
      if(job.Function === "schedule.delete") continue;
      if(job.Function === "schedule.disable") continue;
      if(job.Function === "schedule.disable_job") continue;
      if(job.Function === "schedule.enable") continue;
      if(job.Function === "schedule.enable_job") continue;
      if(job.Function === "schedule.list") continue;
      if(job.Function === "schedule.modify") continue;
      if(job.Function === "schedule.run_job") continue;
      if(job.Function === "sys.doc") continue;
      if(job.Function === "wheel.config.values") continue;
      if(job.Function === "wheel.key.accept") continue;
      if(job.Function === "wheel.key.delete") continue;
      if(job.Function === "wheel.key.list_all") continue;
      if(job.Function === "wheel.key.reject") continue;

      this._addJob(jobContainer, job);
      shown = shown + 1;
    }
    this.jobsLoaded = true;
    if(this.jobsLoaded) this.resolvePromise();
  }

  _runningJobs(data) {
    const jobs = data.return[0];
    for(const k in jobs)
    {
      const job = jobs[k];

      // start with same text as for _addJob
      let targetText = window.makeTargetText(job["Target-type"], job.Target);

      // then add the operational statistics
      if(job.Running.length > 0)
        targetText = targetText + ", " + job.Running.length + " running";
      if(job.Returned.length > 0)
        targetText = targetText + ", " + job.Returned.length + " returned";

      const targetField = document.querySelector(".jobs #job" + k + " .target");
      // the field may not (yet) be on the screen
      if(targetField) targetField.innerText = targetText;
    }
  }

  _addJob(container, job) {
    const tr = document.createElement("tr");

    const jidText = job.id;
    tr.appendChild(Route._createTd("JID", jidText));

    const targetText = window.makeTargetText(job["Target-type"], job.Target);
    tr.appendChild(Route._createTd("Target", targetText));

    const functionText = job.Function;
    tr.appendChild(Route._createTd("Function", functionText));

    const argumentText = job.Argument;
    tr.appendChild(Route._createTd("Argument", argumentText ? argumentText : ""));

    const startTimeText = job.StartTime;
    tr.appendChild(Route._createTd("Start Time", startTimeText));

    const menu = new DropDownMenu(tr);
    menu.addMenuItem("Show&nbsp;job&nbsp;details", function(evt) {
      window.location.assign("/job?id=" + encodeURIComponent(job.id));
    }.bind(this));

    // fill out the number of columns to that of the header
    while(tr.cells.length < container.tHead.rows[0].cells.length) {
      tr.appendChild(Route._createTd("", ""));
    }
    
    container.tBodies[0].appendChild(tr);
  }

  _jobsToArray(jobs) {
    const keys = Object.keys(jobs);
    const newArray = [];

    for(const key of keys) {
      const job = jobs[key];
      job.id = key;
      newArray.push(job);
    }

    return newArray;
  }

  _sortJobs(jobs) {
    jobs.sort(function(a, b){
      // The id is already a integer value based on the date, let's use
      // it to sort the jobs
      if (a.id < b.id) return 1;
      if (a.id > b.id) return -1;
      return 0;
    });
  }

  _copyAddress(evt) {
    const target = evt.target;
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
  }

  _runCommand(evt, targetString, commandString) {
    this.router.commandbox._showManualRun(evt);
    const target = document.querySelector("#target");
    const command = document.querySelector("#command");
    target.value = targetString;
    command.value = commandString;
    // the menu may become (in)visible due to content of command field
    this.router.commandbox.cmdmenu.verifyAll();
  }

  _runStateApply(evt, hostname) {
    this._runCommand(evt, hostname, "state.apply");
  }

  _runAcceptKey(evt, hostname, extra) {
    this._runCommand(evt, hostname, "wheel.key.accept" + extra);
  }

  _runRejectKey(evt, hostname, extra) {
    this._runCommand(evt, hostname, "wheel.key.reject" + extra);
  }

  _runDeleteKey(evt, hostname, extra) {
    this._runCommand(evt, hostname, "wheel.key.delete" + extra);
  }
}
