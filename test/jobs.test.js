var assert = require('assert');
var jobs = require('../app/modules/jobs');


describe('jobs module', function() {

    var initialLength;

    before(function() {
        initialLength = jobs.jobsListLength();
    });


    it('should add 3 new jobs', function() {
        var date = new Date();
        //we set a time one hour in the past, so the job won't get executed during the test
        var hour = date.getHours() == "0" ? "23" : date.getHours() - 1;
        jobTime = hour + ":" + date.getMinutes();

        jobs.addJob(1, "", "", "", "", "", "", "", jobTime, "");
        jobs.addJob(2, "", "", "", "", "", "", "", jobTime, "");
        jobs.addJob(3, "", "", "", "", "", "", "", jobTime, "");

        assert.equal(jobs.jobsListLength(), initialLength + 3);
    });


    it('should remove only 1 job and keep the rest', function() {
        jobs.cancelJob(2);
        assert.equal(jobs.jobsListLength(), initialLength + 2);
    });


});