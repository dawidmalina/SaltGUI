class GrainsMinionRoute extends PageRoute {

  constructor(router) {
    super("^[\/]grainsminion$", "Grains", "#page_grainsminion", "#button_grains", router);

    this.keysLoaded = false;
    this.jobsLoaded = false;

    this._showGrains = this._showGrains.bind(this);

    document.querySelector("#button_close_grainsminion").addEventListener("click", _ => {
      this.router.goTo("/grains");
    });
  }

  onShow() {
    const minions = this;

    const minion = decodeURIComponent(window.getQueryParam("minion"));

    return new Promise(function(resolve, reject) {
      minions.resolvePromise = resolve;
      if(minions.keysLoaded && minions.jobsLoaded) resolve();
      minions.router.api.getGrainsItems(minion).then(minions._showGrains);
      minions.router.api.getJobs().then(minions._updateJobs);
    });
  }

  _showGrains(data) {
    const minion = decodeURIComponent(window.getQueryParam("minion"));

    const grains = data.return[0][minion];

    const title = document.getElementById("grainsminion_title");
    title.innerText = "Grains on " + minion;

    const gmp = document.getElementById("grainsminion_page");
    const menu = new DropDownMenu(gmp);
    menu.addMenuItem("Add&nbsp;grain...", function(evt) {
      // use placeholders for name and value
      this._runCommand(evt, minion, "grains.setval \"name\" \"value\"");
    }.bind(this));

    const container = document.getElementById("grainsminion_list");

    // new menu's are always added at the bottom of the div
    // fix that by re-adding the minion list
    gmp.appendChild(container);

    while(container.tBodies[0].rows.length > 0) {
      container.tBodies[0].deleteRow(0);
    }

    if(!grains) return;

    const keys = Object.keys(grains).sort();
    for(const k of keys) {
      const grain = document.createElement('tr');

      const name = Route._createTd("grain_name", k);
      grain.appendChild(name);

      const grain_value = Output.formatJSON(grains[k]);

      const menu = new DropDownMenu(grain);
      menu.addMenuItem("Edit&nbsp;grain...", function(evt) {
        this._runCommand(evt, minion, "grains.setval \"" + k + "\" " + JSON.stringify(grains[k]));
      }.bind(this));
      if(grain_value.startsWith("[")) {
        menu.addMenuItem("Add&nbsp;value...", function(evt) {
          this._runCommand(evt, minion, "grains.append \"" + k + "\" \"value\"");
        }.bind(this));
      }
      menu.addMenuItem("Delete&nbsp;key...", function(evt) {
        this._runCommand(evt, minion, "grains.delkey \"" + k + "\"");
      }.bind(this));
      menu.addMenuItem("Delete&nbsp;value...", function(evt) {
        this._runCommand(evt, minion, "grains.delval \"" + k + "\"");
      }.bind(this));

      // menu comes before this data on purpose
      const value = Route._createTd("grain_value", json2yaml(grain_value));
      grain.appendChild(value);

      container.tBodies[0].appendChild(grain);
    }
  }
}
