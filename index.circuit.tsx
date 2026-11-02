

import { Reg5vTo3v3 } from "./parts/seveibar.reg-5v-to-3v"
import { useESP32_S3_MINI_1_N8 } from "./parts/seveibar.esp32-s3-mini-1-n8"
import { useUsbC } from "@tsci/seveibar.smd-usb-c"
import { useResistor } from "@tscircuit/core"
// microSD slot (generic 8-pad + card-detect + shield footprint, verify vs. your part)
const microSdPins = {
  pin1: "DAT2", pin2: "CS", pin3: "MOSI", pin4: "VDD", pin5: "CLK",
  pin6: "VSS", pin7: "MISO", pin8: "DAT1", pin9: "CD", pin10: "SHLD",
}
const microSdFootprint = (
  <footprint>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
      <smtpad
        key={n}
        portHints={[`pin${n}`]}
        shape="rect"
        width="0.7mm"
        height="1.5mm"
        pcbX={`${(n - 4.5) * 1.1}mm`}
        pcbY="0mm"
      />
    ))}
    <smtpad portHints={["pin9"]} shape="rect" width="0.7mm" height="1.5mm" pcbX="4.9mm" pcbY="0mm" />
    <smtpad portHints={["pin10"]} shape="rect" width="1.4mm" height="1.9mm" pcbX="-6.5mm" pcbY="-6mm" />
    <smtpad portHints={["pin10"]} shape="rect" width="1.4mm" height="1.9mm" pcbX="6.5mm" pcbY="-6mm" />
  </footprint>
)

export default () => {
  // --- USB 1: power only (5V sink) ---
  const Usb = useReg5vTo3v3("USB")
  const R1 = useResistor("R1", { resistance: "5.1k", footprint: "0402" })
  const R2 = useResistor("R2", { resistance: "5.1k", footprint: "0402" })

  // --- USB 2: keyboard port (ESP32-S3 acts as USB host, so CC gets Rp pull-ups) ---
  const UsbKb = useReg5vTo3v3("USB_KB")
  const R3 = useResistor("R3", { resistance: "56k", footprint: "0402" })
  const R4 = useResistor("R4", { resistance: "56k", footprint: "0402" })
  const C_KB = useCapacitor("C_KB", { capacitance: "10uF", footprint: "0805" })

  const Esp32 = useESP32_S3_MINI_1_N8("U1")

  return (
    <board width="60mm" height="60mm" layers={2} schAutoLayoutEnabled>
      {/* ---------- Existing parts ---------- */}
      <Usb pcbX={-15} pcbY={-26} />
      <Esp32 pcbY={5} />
      <Reg5vTo3v3 pcbX={-12} pcbY={-14} />
      <R1 pcbX={-22} pcbY={-18} pin1={Usb.CC1} pin2="net.GND" />
      <R2 pcbX={-22} pcbY={-15} pin1={Usb.CC2} pin2="net.GND" />

      {/* Power rails (5V from USB 1 only) */}
      <trace from={Usb.VBUS} to="net.V5" />
      <trace from={Usb.GND} to="net.GND" />

      {/* ---------- USB-C #2 : keyboard (USB host on GPIO19/20) ---------- */}
      <UsbKb pcbX={15} pcbY={-26} />
      <R3 pcbX={22} pcbY={-18} pin1={UsbKb.CC1} pin2="net.V5" />
      <R4 pcbX={22} pcbY={-15} pin1={UsbKb.CC2} pin2="net.V5" />
      <C_KB pcbX={12} pcbY={-14} pin1="net.V5" pin2="net.GND" />
      <trace from={UsbKb.VBUS} to="net.V5" />
      <trace from={UsbKb.GND} to="net.GND" />
      {/* tie both D+/D- pairs together so the cable works in either orientation */}
      <trace from={UsbKb.DP1} to={Esp32.IO20} />
      <trace from={UsbKb.DP2} to={Esp32.IO20} />
      <trace from={UsbKb.DM1} to={Esp32.IO19} />
      <trace from={UsbKb.DM2} to={Esp32.IO19} />

      {/* ---------- microSD card (SPI mode, bottom side) ---------- */}
      <chip
        name="J_SD"
        layer="bottom"
        pcbX={-15}
        pcbY={20}
        pinLabels={microSdPins}
        footprint={microSdFootprint}
      />
      <trace from=".J_SD > .VDD" to="net.V3V3" />
      <trace from=".J_SD > .VSS" to="net.GND" />
      <trace from=".J_SD > .SHLD" to="net.GND" />
      <trace from=".J_SD > .CS" to={Esp32.IO10} />
      <trace from=".J_SD > .MOSI" to={Esp32.IO11} />
      <trace from=".J_SD > .CLK" to={Esp32.IO12} />
      <trace from=".J_SD > .MISO" to={Esp32.IO13} />
      {/* pull-ups on CS, MISO, DAT1, DAT2 */}
      <resistor name="R_SD1" resistance="10k" footprint="0402" layer="bottom" pcbX={-24} pcbY={14} connections={{ pin1: "net.V3V3", pin2: ".J_SD > .CS" }} />
      <resistor name="R_SD2" resistance="10k" footprint="0402" layer="bottom" pcbX={-21} pcbY={14} connections={{ pin1: "net.V3V3", pin2: ".J_SD > .MISO" }} />
      <resistor name="R_SD3" resistance="10k" footprint="0402" layer="bottom" pcbX={-18} pcbY={14} connections={{ pin1: "net.V3V3", pin2: ".J_SD > .DAT1" }} />
      <resistor name="R_SD4" resistance="10k" footprint="0402" layer="bottom" pcbX={-15} pcbY={14} connections={{ pin1: "net.V3V3", pin2: ".J_SD > .DAT2" }} />
      <capacitor name="C_SD" capacitance="10uF" footprint="0805" layer="bottom" pcbX={-8} pcbY={14} connections={{ pin1: "net.V3V3", pin2: "net.GND" }} />

      {/* ---------- 20x2 HD44780 character LCD (16-pin header, bottom side) ---------- */}
      <pinheader
        name="J_LCD"
        pinCount={16}
        pitch="2.54mm"
        layer="bottom"
        pcbX={5}
        pcbY={26}
        pcbRotation="90deg"
        pinLabels={["VSS","VDD","V0","RS","RW","E","D0","D1","D2","D3","D4","D5","D6","D7","A","K"]}
      />
      <trace from=".J_LCD > .VSS" to="net.GND" />
      <trace from=".J_LCD > .VDD" to="net.V5" />
      <trace from=".J_LCD > .RW" to="net.GND" />   {/* write-only, so 3.3V GPIO is fine */}
      <trace from=".J_LCD > .K" to="net.GND" />
      <trace from=".J_LCD > .RS" to={Esp32.IO4} />
      <trace from=".J_LCD > .E" to={Esp32.IO5} />
      <trace from=".J_LCD > .D4" to={Esp32.IO6} />
      <trace from=".J_LCD > .D5" to={Esp32.IO7} />
      <trace from=".J_LCD > .D6" to={Esp32.IO15} />
      <trace from=".J_LCD > .D7" to={Esp32.IO16} />
      {/* contrast: V0 -> GND via 1k (tweak value or swap for a trimmer) */}
      <resistor name="R_CON" resistance="1k" footprint="0402" layer="bottom" pcbX={14} pcbY={20} connections={{ pin1: ".J_LCD > .V0", pin2: "net.GND" }} />
      {/* backlight current limit */}
      <resistor name="R_BL" resistance="47" footprint="0603" layer="bottom" pcbX={18} pcbY={20} connections={{ pin1: "net.V5", pin2: ".J_LCD > .A" }} />
    </board>
  )
}