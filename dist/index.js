"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var environment_1 = require("./environment");
var agent_1 = __importDefault(require("@percy/agent"));
Cypress.Commands.add('percySnapshot', function (name, options) {
    if (options === void 0) { options = {}; }
    var percyAgentClient = new agent_1.default({
        handleAgentCommunication: false,
        domTransformation: options.domTransformation
    });
    // Use cy.exec(...) to check if percy agent is running. Ideally this would be
    // done using something like cy.request(...), but that's not currently possible,
    // for details, see: https://github.com/cypress-io/cypress/issues/3161
    var healthcheckCmd = "percy health-check -p " + percyAgentClient.port;
    cy.exec(healthcheckCmd, { failOnNonZeroExit: false }).then(function (_a) {
        var stderr = _a.stderr;
        if (stderr) {
            // Percy server not available
            cy.log('[percy] Percy agent is not running. Skipping snapshots');
            cy.log(stderr);
            return;
        }
        name = name || cy.state('runnable').fullTitle();
        (options.document
            ? new Promise(function (resolve) { return resolve(options.document); })
            : cy.document()).then(function (doc) {
            options.document = doc;
            var domSnapshot = percyAgentClient.snapshot(name, options);
            return cy.request({
                method: 'POST',
                url: "http://localhost:" + percyAgentClient.port + "/percy/snapshot",
                failOnStatusCode: false,
                body: {
                    name: name,
                    url: doc.URL,
                    enableJavaScript: options.enableJavaScript,
                    widths: options.widths,
                    clientInfo: environment_1.clientInfo,
                    environmentInfo: environment_1.environmentInfo,
                    domSnapshot: domSnapshot
                }
            });
        });
    });
});
