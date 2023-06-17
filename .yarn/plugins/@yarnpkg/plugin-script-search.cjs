/* eslint-disable */
try {
    module.exports = require("../../../bundles/@yarnpkg/plugin-script-search");
} catch(e) {
    module.exports = {
        name: "@yarnpkg/plugin-script-search",
        factory: function (require) {
            return {}
        }
    }
}