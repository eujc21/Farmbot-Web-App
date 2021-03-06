import * as React from "react";
import { store } from "../../redux/store";
import { ControlPanelState } from "../interfaces";
import { toggleControlPanel, bulkToggleControlPanel } from "../actions";
import { urlFriendly } from "../../util";
import { DeviceSetting } from "../../constants";
import { trim } from "lodash";
import { push } from "../../history";

const FARMBOT_PANEL = [
  DeviceSetting.farmbotSettings,
  DeviceSetting.name,
  DeviceSetting.timezone,
  DeviceSetting.camera,
  DeviceSetting.osUpdateTime,
  DeviceSetting.osAutoUpdate,
  DeviceSetting.farmbotOS,
  DeviceSetting.autoSync,
  DeviceSetting.bootSequence,
];
const FIRMWARE_PANEL = [
  DeviceSetting.firmwareSection,
  DeviceSetting.firmware,
  DeviceSetting.flashFirmware,
  DeviceSetting.restartFirmware,
];
const POWER_AND_RESET_PANEL = [
  DeviceSetting.powerAndReset,
  DeviceSetting.restartFarmbot,
  DeviceSetting.shutdownFarmbot,
  DeviceSetting.restartFirmware,
  DeviceSetting.factoryReset,
  DeviceSetting.autoFactoryReset,
  DeviceSetting.connectionAttemptPeriod,
  DeviceSetting.changeOwnership,
];
const AXES_PANEL = [
  DeviceSetting.axisSettings,
  DeviceSetting.findHome,
  DeviceSetting.setHome,
  DeviceSetting.findHomeOnBoot,
  DeviceSetting.stopAtHome,
  DeviceSetting.stopAtMax,
  DeviceSetting.negativeCoordinatesOnly,
  DeviceSetting.findAxisLength,
  DeviceSetting.axisLength,
];
const MOTORS_PANEL = [
  DeviceSetting.motors,
  DeviceSetting.maxSpeed,
  DeviceSetting.homingSpeed,
  DeviceSetting.minimumSpeed,
  DeviceSetting.accelerateFor,
  DeviceSetting.stepsPerMm,
  DeviceSetting.microstepsPerStep,
  DeviceSetting.alwaysPowerMotors,
  DeviceSetting.invertMotors,
  DeviceSetting.motorCurrent,
  DeviceSetting.enable2ndXMotor,
  DeviceSetting.invert2ndXMotor,
];
const ENCODERS_PANEL = [
  DeviceSetting.encoders,
  DeviceSetting.stallDetection,
  DeviceSetting.enableEncoders,
  DeviceSetting.enableStallDetection,
  DeviceSetting.stallSensitivity,
  DeviceSetting.useEncodersForPositioning,
  DeviceSetting.invertEncoders,
  DeviceSetting.maxMissedSteps,
  DeviceSetting.missedStepDecay,
  DeviceSetting.encoderScaling,
];
const LIMIT_SWITCHES_PANEL = [
  DeviceSetting.limitSwitchSettings,
  DeviceSetting.enableLimitSwitches,
  DeviceSetting.swapLimitSwitches,
  DeviceSetting.invertLimitSwitches,
];
const ERROR_HANDLING_PANEL = [
  DeviceSetting.errorHandling,
  DeviceSetting.timeoutAfter,
  DeviceSetting.maxRetries,
  DeviceSetting.estopOnMovementError,
];
const PIN_BINDINGS_PANEL = [
  DeviceSetting.pinBindings,
  DeviceSetting.stockPinBindings,
  DeviceSetting.savedPinBindings,
  DeviceSetting.addNewPinBinding,
];
const PIN_GUARD_PANEL = [
  DeviceSetting.pinGuard,
  DeviceSetting.pinGuard1,
  DeviceSetting.pinGuard2,
  DeviceSetting.pinGuard3,
  DeviceSetting.pinGuard4,
  DeviceSetting.pinGuard5,
];
const PARAMETER_MANAGEMENT_PANEL = [
  DeviceSetting.parameterManagement,
  DeviceSetting.paramLoadProgress,
  DeviceSetting.resetHardwareParams,
  DeviceSetting.exportParameters,
  DeviceSetting.importParameters,
  DeviceSetting.resetHardwareParams,
];
const FARM_DESIGNER_PANEL = [
  DeviceSetting.farmDesigner,
  DeviceSetting.animations,
  DeviceSetting.trail,
  DeviceSetting.dynamicMap,
  DeviceSetting.mapSize,
  DeviceSetting.rotateMap,
  DeviceSetting.mapOrigin,
  DeviceSetting.confirmPlantDeletion,
];

/** Look up parent panels for settings. */
const SETTING_PANEL_LOOKUP = {} as Record<DeviceSetting, keyof ControlPanelState>;
FARMBOT_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "farmbot_settings");
FIRMWARE_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "firmware");
POWER_AND_RESET_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "power_and_reset");
AXES_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "axis_settings");
MOTORS_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "motors");
ENCODERS_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "encoders_or_stall_detection");
LIMIT_SWITCHES_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "limit_switches");
ERROR_HANDLING_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "error_handling");
PIN_BINDINGS_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "pin_bindings");
PIN_GUARD_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "pin_guard");
PARAMETER_MANAGEMENT_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "parameter_management");
FARM_DESIGNER_PANEL.map(s => SETTING_PANEL_LOOKUP[s] = "farm_designer");

/** Keep string up until first `(` character (trailing whitespace removed). */
const stripUnits = (settingName: string) => trim(settingName.split("(")[0]);

/** Look up parent panels for settings using URL-friendly names. */
const URL_FRIENDLY_LOOKUP: Record<string, keyof ControlPanelState> = {};
Object.entries(SETTING_PANEL_LOOKUP).map(([setting, panel]) => {
  URL_FRIENDLY_LOOKUP[urlFriendly(setting)] = panel;
  URL_FRIENDLY_LOOKUP[urlFriendly(stripUnits(setting))] = panel;
});

/** Look up all relevant names for the same setting. */
const ALTERNATE_NAMES =
  Object.values(DeviceSetting).reduce((acc, s) => { acc[s] = [s]; return acc; },
    {} as Record<DeviceSetting, DeviceSetting[]>);
ALTERNATE_NAMES[DeviceSetting.encoders].push(DeviceSetting.stallDetection);
ALTERNATE_NAMES[DeviceSetting.stallDetection].push(DeviceSetting.encoders);

/** Generate array of names for the same setting. Most only have one. */
const compareValues = (settingName: DeviceSetting) =>
  (ALTERNATE_NAMES[settingName] as string[])
    .concat(stripUnits(settingName))
    .map(s => urlFriendly(s));

/** Retrieve a highlight search term. */
export const getHighlightName = () => location.search.split("?highlight=").pop();

/** Only open panel and highlight once per app load. Exported for tests. */
export const highlight = { opened: false, highlighted: false };

/** Open a panel if a setting in that panel is highlighted. */
export const maybeOpenPanel = () =>
  (dispatch: Function) => {
    if (highlight.opened) { return; }
    const urlFriendlySettingName = urlFriendly(getHighlightName() || "");
    if (!urlFriendlySettingName) { return; }
    const panel = URL_FRIENDLY_LOOKUP[urlFriendlySettingName];
    dispatch(bulkToggleControlPanel(false));
    dispatch(toggleControlPanel(panel));
    highlight.opened = true;
  };

/** Highlight a setting if provided as a search term. */
export const maybeHighlight = (settingName: DeviceSetting) => {
  const item = getHighlightName();
  if (highlight.highlighted || !item) { return ""; }
  const isCurrentSetting = compareValues(settingName).includes(item);
  if (!isCurrentSetting) { return ""; }
  highlight.highlighted = true;
  return "highlight";
};

export interface HighlightProps {
  settingName: DeviceSetting;
  children: React.ReactChild
  | React.ReactChild[]
  | (React.ReactChild | false)[]
  | (React.ReactChild | React.ReactChild[])[];
  className?: string;
  searchTerm?: string;
}

interface HighlightState {
  className: string;
  hovered: boolean;
}

/** Wrap highlight-able settings. */
export class Highlight extends React.Component<HighlightProps, HighlightState> {
  state: HighlightState = {
    className: maybeHighlight(this.props.settingName),
    hovered: false,
  };

  componentDidMount = () => {
    if (this.state.className == "highlight") {
      /** Slowly fades highlight. */
      this.setState({ className: "unhighlight" });
    }
  }

  get searchTerm() {
    const { resources } = store.getState();
    return resources.consumers.farm_designer.settingsSearchTerm;
  }

  toggleHover = (hovered: boolean) => () => this.setState({ hovered });

  render() {
    const show = !this.searchTerm ||
      this.props.settingName.toLowerCase().includes(this.searchTerm.toLowerCase());
    return <div className={[
      "setting",
      this.props.className,
      this.state.className,
    ].join(" ")}
      onMouseEnter={this.toggleHover(true)}
      onMouseLeave={this.toggleHover(false)}
      hidden={!show}>
      {this.props.children}
      {this.props.settingName &&
        <i className={`fa fa-anchor ${this.props.className} ${
          this.state.hovered ? "hovered" : ""}`}
          onClick={() => push(linkToSetting(this.props.settingName))} />}
    </div>;
  }
}

const linkToSetting = (settingName: DeviceSetting) =>
  `/app/designer/settings?highlight=${urlFriendly(stripUnits(settingName))}`;

export const linkToFbosSettings = () => linkToSetting(DeviceSetting.farmbotOS);
