class RunType {

  static getRunType() {
    const isAsyncChecked = document.getElementById("run_checkbox").checked;
    if (isAsyncChecked === undefined || isAsyncChecked === "" || isAsyncChecked === false) {
      return "normal";
    } else {
      return "async";
    }
  }

}
