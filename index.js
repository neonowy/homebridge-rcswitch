const rc = require("rcswitch");

const DEFAULT_WIRINGPI_PIN = 0;
const DEFAULT_RCSWITCH_PULSE_LENGTH = 350;

let Service;
let Characteristic;

function RcSwitchAccessory(log, config) {
  this.log = log;

  this.name = config.name;
  this.pin = config.pin || DEFAULT_WIRINGPI_PIN;
  this.pulseLength = config.pulseLength || DEFAULT_RCSWITCH_PULSE_LENGTH;
  this.codeOn = config.codeOn;
  this.codeOff = config.codeOff;
  this.triStateCodeOn = config.triStateCodeOn;
  this.triStateCodeOff = config.triStateCodeOff;

  this.state = false;

  this.service = new Service.Switch(this.name);
  this.service
    .getCharacteristic(Characteristic.On)
    .on("get", this.getState.bind(this))
    .on("set", this.setState.bind(this));

  this.infoService = new Service.AccessoryInformation();
  this.infoService
    .setCharacteristic(Characteristic.Name, "RcSwitch")
    .setCharacteristic(Characteristic.Manufacturer, "neonowy")
    .setCharacteristic(Characteristic.Model, "v1.0.0")
    .setCharacteristic(
      Characteristic.SerialNumber,
      `${this.pin}::${this.pulseLength}::${this.codeOn ||
        this.triStateCodeOn}::${this.codeOff || this.triStateCodeOff}`
    );
}

RcSwitchAccessory.prototype.getState = function(callback) {
  callback(null, this.state);
};

RcSwitchAccessory.prototype.setState = function(newState, callback) {
  this.state = newState;

  rc.enableTransmit(this.pin);
  rc.setPulseLength(this.pulseLength);

  const sendCode = code => rc.send(code);
  const sendTriStateCode = triStateCode => rc.sendTriState(triStateCode);

  if (this.state) {
    if (this.codeOn) {
      sendCode(this.codeOn);
    } else if (this.triStateCodeOn) {
      sendTriStateCode(this.triStateCodeOn);
    } else {
      this.log("Error: Missing ON code.");
      return callback(new Error("Error: Missing ON code."));
    }
  } else {
    if (this.codeOff) {
      sendCode(this.codeOff);
    } else if (this.triStateCodeOff) {
      sendTriStateCode(this.triStateCodeOff);
    } else {
      this.log("Error: Missing OFF code.");
      return callback(new Error("Error: Missing ON code."));
    }
  }

  return callback(null);
};

RcSwitchAccessory.prototype.getServices = function() {
  return [this.service, this.infoService];
};

module.exports = homebridge => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    "homebridge-rcswitch",
    "RcSwitch",
    RcSwitchAccessory
  );
};
