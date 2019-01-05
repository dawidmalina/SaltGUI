class JobsRoute extends PageRoute {

  constructor(router) {
    super("^[\/]jobs$", "Jobs", "#page_jobs", "#button_jobs", router);
    this.jobsLoaded = false;
  }

  onShow() {
    const jobs = this;
    return new Promise(function(resolve, reject) {
      jobs.resolvePromise = resolve;
      if(minions.jobsLoaded) resolve();
      jobs.router.api.getJobs().then(jobs._updateJobs);
      keys.router.api.getJobsActive().then(jobs._runningJobs);
    });
  }

}
