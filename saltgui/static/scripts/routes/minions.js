class MinionsRoute extends PageRoute {

  constructor(router) {
    super("^[\/]$", "Minions", "#page_minions", "#button_minions", router);
    this.keysLoaded = false;

    this._updateKeys = this._updateKeys.bind(this);
    this._runStateApply = this._runStateApply.bind(this);
  }

  onShow() {
    const minions = this;
    return new Promise(function(resolve, reject) {
      minions.resolvePromise = resolve;
      if(minions.keysLoaded) resolve();
      minions.router.api.getMinions().then(minions._updateMinions);
      minions.router.api.getKeys().then(minions._updateKeys);
      //we need these functions to populate the dropdown boxes
      minions.router.api.getConfigValues().then(minions._configvalues);
    });
  }

  _configvalues(data) {
    // store for later use

    const templates = data.return[0].data.return.saltgui_templates;
    localStorage.setItem("templates", JSON.stringify(templates));

    const public_pillars = data.return[0].data.return.saltgui_public_pillars;
    localStorage.setItem("public_pillars", JSON.stringify(public_pillars));

    let nodegroups = data.return[0].data.return.nodegroups;
    if(!nodegroups) nodegroups = {};
    localStorage.setItem("nodegroups", JSON.stringify(nodegroups));
  }

  _updateKeys(data) {
    const keys = data.return;

    const list = this.getPageElement().querySelector("#minions");

    const hostnames = keys.minions.sort();
    for(const hostname of hostnames) {
      this._addMinion(list, hostname);
    }

    this.keysLoaded = true;
    if(this.keysLoaded) this.resolvePromise();
  }

  _addMenuItemStateApply(menu, hostname) {
    menu.addMenuItem("Apply&nbsp;state...", function(evt) {
      this._runStateApply(evt, hostname);
    }.bind(this));
  }

  _updateOfflineMinion(container, hostname) {
    super._updateOfflineMinion(container, hostname);
    
    const element = document.getElementById(hostname);
    
    // force same columns on all rows
    element.appendChild(Route._createTd("saltversion", ""));
    element.appendChild(Route._createTd("os", ""));
    element.appendChild(Route._createTd("run-command-button", ""));
  }

  _updateMinion(container, minion, hostname) {
    super._updateMinion(container, minion, hostname);

    const element = document.getElementById(hostname);
    const menu = new DropDownMenu(element);
    this._addMenuItemStateApply(menu, hostname);
  }

}
