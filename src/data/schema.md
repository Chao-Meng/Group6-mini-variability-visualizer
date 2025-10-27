{
  "root": "InfusionPump",
  "features": [
    { "id": "InfusionPump", "label": "Infusion Pump", "type": "mandatory" },
    { "id": "SafetySystem", "label": "Safety System", "type": "mandatory", "parent": "InfusionPump" },
    { "id": "SensorRedundancy", "label": "Sensor Redundancy", "type": "optional", "parent": "SafetySystem" },
    { "id": "BatteryBackup", "label": "Battery Backup", "type": "optional", "parent": "SafetySystem" },
    { "id": "Communication", "label": "Communication", "type": "optional", "parent": "InfusionPump" },
    { "id": "Bluetooth", "label": "Bluetooth", "type": "optional", "parent": "Communication" },
    { "id": "WiFi", "label": "Wi-Fi", "type": "optional", "parent": "Communication" }
  ],
  "constraints": [
    { "type": "requires", "a": "Bluetooth", "b": "BatteryBackup" },
    { "type": "excludes", "a": "Bluetooth", "b": "WiFi" }
  ]
}
