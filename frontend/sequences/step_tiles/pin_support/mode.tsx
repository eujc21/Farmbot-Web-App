import * as React from "react";
import { DropDownItem, Col, FBSelect } from "../../../ui";
import { SequenceBodyItem, ALLOWED_PIN_MODES, WritePin } from "farmbot";
import { StepParams } from "../../interfaces";
import { editStep } from "../../../api/crud";
import { t } from "../../../i18next_wrapper";
import { isBoxLed } from "./index";

export function PinModeDropdown(props: StepParams) {
  return <Col xs={6} md={3}>
    <label>{t("Mode")}</label>
    <FBSelect
      key={JSON.stringify(props.currentSequence)}
      onChange={ddi => setPinMode(ddi, props)}
      selectedItem={currentModeSelection(props.currentStep)}
      list={getPinModes(props.currentStep)} />
  </Col>;
}

export function setPinMode(ddi: DropDownItem, stepParams: StepParams) {
  const { dispatch, currentStep, index, currentSequence } = stepParams;
  dispatch(editStep({
    sequence: currentSequence,
    step: currentStep,
    index: index,
    executor: (step: WritePin) => {
      if (isPinMode(ddi.value)) {
        step.args.pin_mode = ddi.value;
        switch (ddi.value) {
          case PinMode.digital:
            step.args.pin_value = Math.min(step.args.pin_value, 1);
            break;
          case PinMode.analog:
            step.args.pin_value = step.args.pin_value == 1 ? 255 : 0;
            break;
        }
      } else {
        throw new Error("pin_mode must be one of ALLOWED_PIN_MODES.");
      }
    }
  }));
}

export function currentModeSelection(currentStep: SequenceBodyItem) {
  const step = currentStep as WritePin;
  const pinMode = step.args.pin_mode;
  const modes: { [s: string]: string } = {
    [PinMode.digital]: t("Digital"),
    [PinMode.analog]: t("Analog")
  };
  return { label: modes[pinMode], value: pinMode };
}

enum PinMode {
  digital = 0,
  analog = 1,
}

// tslint:disable-next-line:no-any
const isPinMode = (x: any): x is ALLOWED_PIN_MODES =>
  Object.values(PinMode).includes(x);

export const getPinModes = (step?: SequenceBodyItem) => [
  ...(step && isBoxLed(step)
    ? []
    : [{ value: PinMode.analog, label: t("Analog") }]),
  { value: PinMode.digital, label: t("Digital") },
];
