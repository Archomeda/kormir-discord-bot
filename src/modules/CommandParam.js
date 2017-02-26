'use strict';

class CommandParam {
    constructor(name, helpText, isOptional, type, isExpanded) {
        this.name = name;
        this.helpText = helpText;
        this.isOptional = isOptional || false;
        this.type = type;
        this.isExpanded = isExpanded || false;
    }
}

module.exports = CommandParam;
