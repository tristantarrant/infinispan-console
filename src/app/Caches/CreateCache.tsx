import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  Button,
  Expandable,
  Form,
  FormGroup,
  PageSection,
  Select,
  SelectOption,
  SelectVariant,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';
import {CubeIcon} from "@patternfly/react-icons";
import cacheService from "../../services/cacheService";
import dataContainerService from "../../services/dataContainerService";
import {Link} from "react-router-dom";

const CreateCache: React.FunctionComponent<any> = (props) => {
  const cm = props.location.state.cacheManager;
  const [cacheName, setCacheName] = useState('');
  const [validName, setValidName] = useState(true);
  const [config, setConfig] = useState('');
  const [configs, setConfigs] = useState<OptionSelect[]>([]);
  const [expandedSelect, setExpandedSelect] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<null | string>(null);
  const [selectedConfigDisabled, setSelectedConfigDisabled] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [validConfig, setValidConfig] = useState(true);
  const [cacheAlert, setCacheAlert] = useState({message: '', display: false, success: false});

  interface OptionSelect {
    value: string;
    disabled?: boolean;
    isPlaceholder?: boolean
  }

  useEffect(() => {
    dataContainerService.getCacheManager(cm.name)
      .then(cacheManager => {
        let options: OptionSelect[] = [];
        cacheManager.cache_configuration_names.map(name => {
          options.push({value: name})
        });
        setConfigs(options);
      });
  }, []);

  const onToggleConfigPanel = () => {
    const expanded = !configExpanded;
    setConfigExpanded(expanded);
    setSelectedConfigDisabled(expanded);
    setSelectedConfig(null);
  };

  const handleChangeName = name => {
    setCacheName(name);
  };

  const handleChangeConfig = config => {
    setConfig(config);
  };

  const onToggle = isExpanded => {
    setExpandedSelect(isExpanded);
  };

  const clearSelection = () => {
    setSelectedConfig(null);
    setExpandedSelect(false);
  };

  const onSelect = (event, selection, isPlaceholder) => {
    if (isPlaceholder) clearSelection();
    else {
      setSelectedConfig(selection);
      setExpandedSelect(false);
    }
  };

  const validateConfig = () => {
    const trimmedConf = config.trim();
    if (config.length == 0) {
      return false;
    }
    let isJson = false;
    let isXML = false;
    try {
      JSON.parse(trimmedConf);
      isJson = true;
    } catch (ex) {
    }

    try {
      let oDOM = new DOMParser().parseFromString(trimmedConf, "text/xml");
      if (oDOM.getElementsByTagName('parsererror').length == 0) {
        isXML = true;
      }
    } catch (ex) {

    }
    return isJson || isXML;
  };

  const createCache = () => {
    const name = cacheName.trim();
    if (name.length == 0) {
      setValidName(false);
    } else {
      setValidName(true);
    }
    if (selectedConfig == null && !validateConfig()) {
      setValidConfig(false);
    } else {
      setValidConfig(true);
    }

    if (!validName || !validConfig) {
      return;
    }

    if (selectedConfig != null) {
      cacheService.createCacheByConfigName(name, selectedConfig)
        .then(message => setCacheAlert({message: message.message, success: message.success, display: true}));
    } else {
      cacheService.createCacheWithConfiguration(name, config)
        .then(message => setCacheAlert({message: message.message, success: message.success, display: true}));
    }
  };

  const hideCreation = () => {
    setCacheAlert({message: '', success: false, display: false});
  };

  const AlertPanel = () => {
    return <React.Fragment>{cacheAlert.display ?
      <Alert style={{margin:10}} variant={cacheAlert.success ? AlertVariant.success : AlertVariant.danger}
             title={cacheAlert.message == '' ? 'Cache created correctly' : cacheAlert.message}
             action={<AlertActionCloseButton onClose={hideCreation}/>}/> :
      ''}
    </React.Fragment>;
  };

  const titleId = 'plain-typeahead-select-id';
  return (
    <PageSection>
      <Title size="lg"> Create a cache in <b>{cm.name}</b> container</Title>
      <AlertPanel/>
      <Form style={{paddingTop: 10}}>
        <FormGroup
          label="Name"
          isRequired
          fieldId="cache-name"
          helperText="Please provide a cache name"
        >
          <TextInput
            isRequired
            type="text"
            id="cache-name"
            name="cache-name"
            aria-describedby="cache-name-helper"
            value={cacheName}
            onChange={handleChangeName}
            isValid={validName}
          />
        </FormGroup>
        <FormGroup fieldId='cache-config-name'
                   label="Template"
                   helperText="Please choose a template or provide a new configuration"
        >
          <span id={titleId} hidden>
          Choose a configuration
        </span>
          <Select
            toggleIcon={true && <CubeIcon/>}
            variant={SelectVariant.typeahead}
            aria-label="Cache configs"
            onToggle={onToggle}
            onSelect={onSelect}
            // @ts-ignore
            selections={selectedConfig}
            isExpanded={expandedSelect}
            isDisabled={selectedConfigDisabled}
            ariaLabelledBy={titleId}
          >
            {configs.map((option, index) => (
              <SelectOption
                isDisabled={option.disabled}
                key={index}
                value={option.value}
                isPlaceholder={option.isPlaceholder}
              />
            ))}
          </Select>

        </FormGroup>
        <Expandable toggleText="Provide a configuration" isExpanded={configExpanded} onToggle={onToggleConfigPanel}>
          <FormGroup label="Config"
                     fieldId="cache-config"
                     helperText="Please provide a cache config JSON or XML">
            <TextArea
              isRequired
              value={config}
              onChange={handleChangeConfig}
              name="cache-config"
              id="cache-config"
              isValid={validConfig}
            />
          </FormGroup>
        </Expandable>

        <ActionGroup>
          <Button variant="primary" onClick={createCache}>Create</Button>
          <Link to='/'><Button variant="secondary" component="a" target="_blank">Back</Button>
          </Link>
        </ActionGroup>
      </Form>
    </PageSection>
  );
}
export {CreateCache};
