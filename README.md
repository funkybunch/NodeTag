## DEPRECATION NOTICE: This project will not receive further updates as there is an effort ongoing to incorporate these devices into an existing integration already in Home Assistant.

# NodeTag
 A read-only NodeJS client for the Maytag API for connected Washer & Dryer Appliances.

## Installation
It is recommended to use a process manager such as [pm2](https://pm2.keymetrics.io/) to easily run NodeTag as a service, including starting on boot.

This project is written using the [Node.js runtime](https://nodejs.org/en/download/).  Make sure you have it installed before continuing.

Clone the repository, move it to the directory you want it to stay, and then run `npm install` inside the installation directory.

Next, rename `.env-sample` to `.env` and set `MAYTAG_ACCOUNT_NAME` to your account email address.  Set your password in the `MAYTAG_PASSWORD` variable.
Optionally, you can also add and set the `REFRESH_TIME` variable, but this will default to `10000` (milliseconds), or 10 seconds.

Run using the command `npm start`.

## Using with Home Assistant
Currently, there is no direct integration for Home Assistant, but this API client
can be consumed using the [`RESTful Sensor`](https://www.home-assistant.io/integrations/sensor.rest/) built into Home Assistant.

Here is a sample `yaml` configuration for this sensor:
### Washers
```yaml
sensor:
  - platform: rest
    resource: <NodeTag URL>/appliances/washers
    name: washer
    scan_interval: 2
    value_template: "{{ value_json[0].status }}"
    json_attributes_path: "$.[0]"
    json_attributes:
      - doorOpen
      - doorLocked
      - drawerOpen
      - cycleId
      - cycleName
      - needsClean
      - delayTime
      - delayRemaining
      - rinsing
      - draining
      - filling
      - spinning
      - soaking
      - sensing
      - washing
      - addGarmet
      - operations
      - hoursInUse
      - totalCycles
      - remoteEnabled
      - temperature
      - spinSpeed
      - soilLevel
      - timeRemaining
      - online
```

### Dryers
```yaml
sensor:
  - platform: rest
    resource: <NodeTag URL>/appliances/dryers
    name: dryer
    scan_interval: 2
    value_template: "{{ value_json[0].status }}"
    json_attributes_path: "$.[0]"
    json_attributes:
      - doorOpen
      - cycleId
      - cycleName
      - manualDryTime
      - drynessLevel
      - airflow
      - drying
      - damp
      - steaming
      - sensing
      - cooldown
      - temperature
      - operations
      - hoursInUse
      - totalCycles
      - remoteEnabled
      - timeRemaining
      - online
```

These sample configurations will create an entity with the status as the state, with the remaining data points as attributes.
