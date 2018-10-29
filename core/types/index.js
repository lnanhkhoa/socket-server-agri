const supportType = {
    RawType: require('./raw'),
    StringType: require('./string'),
    BooleanType: require('./boolean'),
    NumberType: require('./number'),
    ObjectType: require('./object'),
    ListType: require('./list'),
    DatetimeType: require('./datetime'),
};

let types = {};
for (let typeName in supportType) {
    let name = typeName[0].toLowerCase() + typeName.substring(1, typeName.length - 4);
    types[name] = supportType[typeName].init.bind(supportType[typeName]);
}
types = Object.assign(types, supportType);

module.exports = types;