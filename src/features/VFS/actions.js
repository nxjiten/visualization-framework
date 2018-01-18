import React from 'react';
import { push } from 'redux-router';
import { change } from 'redux-form';
import { ServiceManager } from "../../services/servicemanager";
import { selectFieldValues } from '../../ui-components/utils';
import { getError } from '../../components/Editor/utils';
import {
    getNetworkProtocolForText,
} from './NetworkData';

import {
    Actions as ServiceActions,
    ActionKeyStore as ServiceActionKeyStore
} from "../../services/servicemanager/redux/actions";

import {
    ActionKeyStore as InterfaceActionKeyStore
} from "../../components/App/redux/actions";

import {
    Actions as VFSActions,
    ActionKeyStore as VFSActionKeyStore,
} from '../redux/actions';

import {
    Actions as MessageBoxActions,
} from "../../components/MessageBox/redux/actions";

import {
    getEnterpriseID,
    getDomainID
} from './utils';

export const NetworkObjectTypes = {
    ZONE: "ZONE",
    SUBNET: "SUBNET",
    POLICYGROUP: "POLICYGROUP",
    PGEXPRESSION: "PGEXPRESSION",
    ENTERPRISE_NETWORK: 'ENTERPRISE_NETWORK',
    NETWORK_MACRO_GROUP: 'NETWORK_MACRO_GROUP',
    L2_DOMAIN_ID: 'l2domainID',
    MIRROR_DESTINATION_ID: 'mirrorDestinationID',
    OVERLAY_MIRROR_DESTINATION_ID: 'overlayMirrorDestinationID',
    L7_APP_SIGNATURE_ID: 'associatedL7ApplicationSignatureID',
    VIRTUAL_FIREWALL_RULE: 'virtualfirewallrules',
    VIRTUAL_FIREWALL_POLICIES: 'virtualfirewallpolicies'
};

export const getNetworkItems = (type, props) => {
    const {
        data,
    } = props;

    const enterpriseID = getEnterpriseID(props);
    const domainID = getDomainID(props.resourceName, data);
    const parentResource = props.resourceName;
    const reqID = getRequestID({type, domainID, enterpriseID, parentResource, ...props});

    return reqID ? props.getRequestResponse(reqID) : null;
}

const getRequestResponse = (state, path) => {
    return {
        data: state.services.getIn([ServiceActionKeyStore.REQUESTS, path, ServiceActionKeyStore.RESULTS]),
        isFetching: state.services.getIn([ServiceActionKeyStore.REQUESTS, path, ServiceActionKeyStore.IS_FETCHING]),
        error: state.services.getIn([ServiceActionKeyStore.REQUESTS, path, ServiceActionKeyStore.ERROR]),
    }
}
const buildMapStateToProps = (state, ownProps) => {
    const query = state.router.location.query;
    const { id } = query;
    const context = state.interface.get(InterfaceActionKeyStore.CONTEXT);
    let parentQuery = state.VFS.getIn([VFSActionKeyStore.SELECTED_ROW, id, VFSActionKeyStore.SELECTED_ROW_PARENT_QUERY]);
    if (!parentQuery || Object.getOwnPropertyNames(parentQuery).length <= 0) {
        parentQuery = context;
    }

    let parentPath = state.VFS.getIn([VFSActionKeyStore.SELECTED_ROW, id, VFSActionKeyStore.SELECTED_ROW_PARENT_PATHNAME]);
    if (!parentPath) {
        parentPath = `${process.env.PUBLIC_URL}/dashboards/vssDomainFlowExplorer`;
    }

    return {
        data: state.VFS.getIn([VFSActionKeyStore.SELECTED_ROW, id, VFSActionKeyStore.SELECTED_ROW_DATA]),
        parentQuery,
        parentPath,
        context,
        visualizationType: state.interface.get(InterfaceActionKeyStore.VISUALIZATION_TYPE),
    };

}
const vfsPoliciesConfig = (domainID, resourceName = 'domains') => {
    return (
            {
                service: "VSD",
                query: {
                    parentResource: resourceName,
                    parentID: domainID,
                    resource: "virtualfirewallpolicies",
                    filter: 'policyState == "DRAFT"',
                }
            }
        );
}

const vfsRulesConfig = (domainID, protocol, { locationType, locationID, networkType, networkID }, resourceName = 'domains' ) => {

    let xNuageFilter = `protocol == "${protocol}"`;
    if (locationType) {
        xNuageFilter = `${xNuageFilter} AND locationType == "${locationType}"`
    }
    if (locationID) {
        xNuageFilter = `${xNuageFilter} AND locationID == "${locationID}"`
    }

    if (networkType) {
        xNuageFilter = `${xNuageFilter} AND networkType == "${networkType}"`
    }
    if (networkID) {
        xNuageFilter = `${xNuageFilter} AND networkID == "${networkID}"`
    }

    // filter: xNuageFilter,
    const configuration = {
        service: "VSD",
        query: {
            parentResource: resourceName,
            parentID: domainID,
            resource: "virtualfirewallrules",
            filter: xNuageFilter,
        }
    }
    return configuration;
}

export const showMessageBoxOnNoFlow = (props) => {
    const { data, showMessageBox, toggleError } = props;

    if (!data || Object.getOwnPropertyNames(data).length <= 0) {
        const body = () =>
            <span style={{ display: 'inline-flex', color: 'blue', fontSize: 12, padding: 20 }}>Select first a flow to use for creating a new Virtual Firewall Rule</span>;

        showMessageBox('No flow selected', body());
        toggleError(true);
        return false;
    }
    return true;
}

export const fetchAssociatedObjectIfNeeded = (props) => {
    const {
        type,
        ID,
        args,
        data,
        fetchSubnetsIfNeeded,
        fetchZonesIfNeeded,
        fetchPGsIfNeeded,
        fetchPGExpressionsIfNeeded,
        fetchNetworkMacroGroupsIfNeeded,
        fetchNetworkMacrosIfNeeded,
        fetchMirrorDestinationsIfNeeded,
        fetchL2DomainsIfNeeded,
        fetchOverlayMirrorDestinationsIfNeeded,
        fetchL7ApplicationSignaturesIfNeeded,
        fetchFirewallRulesIfNeeded,
        fetchDomainFirewallPoliciesIfNeeded,
        resourceName,
        domainID,
        enterpriseID
    } = props;

    if (!type) {
        return;
    }

    switch (type) {
        case NetworkObjectTypes.ZONE:
            fetchZonesIfNeeded(domainID, resourceName, ID);
            break;
        case NetworkObjectTypes.SUBNET:
            fetchSubnetsIfNeeded(domainID, resourceName, ID);
            break;
        case NetworkObjectTypes.POLICYGROUP:
            fetchPGsIfNeeded(domainID, resourceName, ID);
            break;
        case NetworkObjectTypes.PGEXPRESSION:
            fetchPGExpressionsIfNeeded(domainID, resourceName, ID);
            break;
        case NetworkObjectTypes.ENTERPRISE_NETWORK:
            fetchNetworkMacrosIfNeeded(enterpriseID);
            break;
        case NetworkObjectTypes.NETWORK_MACRO_GROUP:
            fetchNetworkMacroGroupsIfNeeded(enterpriseID);
            break;
        case NetworkObjectTypes.L2_DOMAIN_ID:
            fetchL2DomainsIfNeeded(enterpriseID);
            break;
        case NetworkObjectTypes.MIRROR_DESTINATION_ID:
            fetchMirrorDestinationsIfNeeded();
            break;
        case NetworkObjectTypes.OVERLAY_MIRROR_DESTINATION_ID:
            fetchOverlayMirrorDestinationsIfNeeded(ID);
            break;
        case NetworkObjectTypes.L7_APP_SIGNATURE_ID:
            fetchL7ApplicationSignaturesIfNeeded(enterpriseID);
            break;
        case NetworkObjectTypes.VIRTUAL_FIREWALL_RULE:
            const { locationType, networkType } = args;
            if (locationType && networkType ) {
                const protocol = getNetworkProtocolForText(data.protocol);
                fetchFirewallRulesIfNeeded(domainID, protocol, args, resourceName);
            }
            break;
        case NetworkObjectTypes.VIRTUAL_FIREWALL_POLICIES:
            fetchDomainFirewallPoliciesIfNeeded (domainID, resourceName);
            break;
        default:

    }
}

export const getRequestID = props => {
    const {
        enterpriseID,
        domainID,
        l2DomainID,
        parentResource,
        type,
        ID,
        data,
        formObject
    } = props;

    let resourceName = null;
    let parentID = null;
    if (!type) {
        return null;
    }
    switch (type) {
        case NetworkObjectTypes.ZONE:
            if (ID) {
                resourceName = "zones";
                parentID = domainID;
            }
            else
            {
                return `${parentResource}/${domainID}/zones`;
            }
            break;
        case NetworkObjectTypes.SUBNET:
            if (ID) {
                resourceName = "subnets";
                parentID = domainID;
            }
            else
            {
                return `${parentResource}/${domainID}/subnets`;
            }
            break;
        case NetworkObjectTypes.POLICYGROUP:
            if (ID) {
                resourceName = "policygroups";
                parentID = domainID;
            }
            else
            {
                return `${parentResource}/${domainID}/policygroups`;
            }
            break;
        case NetworkObjectTypes.PGEXPRESSION:
            if (ID) {
                resourceName = "pgexpressions";
                parentID = domainID;
            }
            else
            {
                return `${parentResource}/${domainID}/pgexpressions`;
            }
            break;
        case NetworkObjectTypes.ENTERPRISE_NETWORK:
            return `enterprises/${enterpriseID}/enterprisenetworks`;
        case NetworkObjectTypes.NETWORK_MACRO_GROUP:
            return `enterprises/${enterpriseID}/networkmacrogroups`;
        case NetworkObjectTypes.L2_DOMAIN_ID:
            return `enterprises/${enterpriseID}/l2domains`;
        case NetworkObjectTypes.MIRROR_DESTINATION_ID:
            return "mirrordestinations";
        case NetworkObjectTypes.OVERLAY_MIRROR_DESTINATION_ID:
            return `l2domains/${l2DomainID}/overlaymirrordestinations`;
        case NetworkObjectTypes.L7_APP_SIGNATURE_ID:
            return `enterprises/${enterpriseID}/l7applicationsignatures`;
        case NetworkObjectTypes.VIRTUAL_FIREWALL_POLICIES:
            return ServiceManager.getRequestID(vfsPoliciesConfig(domainID, parentResource));
        case NetworkObjectTypes.VIRTUAL_FIREWALL_RULE:
            const formValues = formObject ? formObject.values : [];
            const protocol = data ? getNetworkProtocolForText(data.protocol) : null;
            return ServiceManager.getRequestID(vfsRulesConfig(domainID, protocol, formValues, parentResource));
        default:
            return;
    }

    return ServiceManager.getRequestID(getConfiguration({parentResource, parentID, resourceName, ID}));
}

const getConfiguration = ({ parentResource, parentID, resourceName, ID}) => {
    const query = ID ? {
        parentResource: resourceName,
        parentID: ID
    } : {
        parentResource: parentResource,
        parentID: parentID,
        resource: resourceName
    };

    return {
        service: "VSD",
        query
    };
}

export const mapStateToProps = (state, ownProps) => {
    const query = state.router.location.query;
    const { operation, domainType } = query ? query : {};
    const queryConfiguration = {
        service: "VSD",
        query: {
            parentResource: "enterprises",
        }
    };

    const formName = operation === 'add' ? 'add-flow-editor' : 'flow-editor';

    const fieldValues = operation === 'add' ? selectFieldValues(state,
        formName,
        'locationType',
        'networkType',
        'locationID',
        'networkID',
        'ID') :
        selectFieldValues(state,
            formName,
            'locationType',
            'networkType',
            'locationID',
            'networkID',
            'mirrorDestinationType',
            'l2domainID',
            'parentID',
        );
    const formObject = state.form ? state.form[formName] : null;

    const resourceName = (domainType === 'nuage_metadata.domainName' || domainType === 'Domain') ?
        'domains' : 'l2domains';

    return {
        ...buildMapStateToProps(state, ownProps),
        operation,
        isConnected: state.services.getIn([ServiceActionKeyStore.REQUESTS, ServiceManager.getRequestID(queryConfiguration), ServiceActionKeyStore.RESULTS]),
        formObject,
        getFieldError: (fieldName) => getError(state, formName, fieldName),
        query,
        resourceName,
        getRequestResponse: requestID => getRequestResponse(state, requestID),
        ...fieldValues,
    };
}

export const actionCreators = (dispatch) => ({
    fetchDomainFirewallPoliciesIfNeeded: (domainID, resourceName = 'domains') => {
        return dispatch(ServiceActions.fetchIfNeeded(vfsPoliciesConfig(domainID, resourceName)));
    },
    fetchFirewallRulesIfNeeded: ( domainID, protocol, values, resourceName = 'domains' ) => {
        const configuration = vfsRulesConfig(domainID, protocol, values, resourceName);
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchSubnetsIfNeeded: (domainID, resourceName = 'domains', ID) => {
        const query = ID ? {
            parentResource: "subnets",
            parentID: ID
        } : {
            parentResource: resourceName,
            parentID: domainID,
            resource: "subnets"
        };

        const configuration = {
            service: "VSD",
            query
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchMirrorDestinationsIfNeeded: () => {
        const configuration = {
            service: "VSD",
            query: {
                parentResource: "mirrordestinations",
            }
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchZonesIfNeeded: (domainID, resourceName = 'domains', ID) => {
        const query = ID ? {
            parentResource: "zones",
            parentID: ID
        } : {
            parentResource: resourceName,
            parentID: domainID,
            resource: "zones"
        };

        const configuration = {
            service: "VSD",
            query
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchNetworkMacrosIfNeeded: (enterpriseID) => {
        const configuration = {
            service: "VSD",
            query: {
                parentResource: "enterprises",
                parentID: enterpriseID,
                resource: "enterprisenetworks"
            }
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchNetworkMacroGroupsIfNeeded: (enterpriseID) => {
        const configuration = {
            service: "VSD",
            query: {
                parentResource: "enterprises",
                parentID: enterpriseID,
                resource: "networkmacrogroups"
            }
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchL2DomainsIfNeeded: (enterpriseID) => {
        const configuration = {
            service: "VSD",
            query: {
                parentResource: "enterprises",
                parentID: enterpriseID,
                resource: "l2domains"
            }
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchPGsIfNeeded: (domainID, resourceName = 'domains', ID) => {
        const query = ID ? {
            parentResource: "policygroups",
            parentID: ID
        } : {
            parentResource: resourceName,
            parentID: domainID,
            resource: "policygroups"
        };

        const configuration = {
            service: "VSD",
            query
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchPGExpressionsIfNeeded: (domainID, resourceName = 'domains', ID) => {
        const query = ID ? {
            parentResource: "pgexpressions",
            parentID: ID
        } : {
            parentResource: resourceName,
            parentID: domainID,
            resource: "pgexpressions"
        };

        const configuration = {
            service: "VSD",
            query
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchOverlayMirrorDestinationsIfNeeded: (domainID) => {
        //overlaymirrordestinations
        const configuration = {
            service: "VSD",
            query: {
                parentResource: "l2domains",
                parentID: domainID,
                resource: "overlaymirrordestinations"
            }
        }
        return dispatch(ServiceActions.fetchIfNeeded(configuration));
    },
    fetchL7ApplicationSignaturesIfNeeded: (enterpriseID) => {
        const config = {
            service: 'VSD',
            query: {
                parentResource: 'enterprises',
                parentID: enterpriseID,
                resource: "l7applicationsignatures",
            }
        }
        return dispatch(ServiceActions.fetchIfNeeded(config));
    },
    goTo: (pathname, query) => dispatch(push({pathname: pathname, query: query})),
    showMessageBox: (title, body) => dispatch(MessageBoxActions.toggleMessageBox(true, title, body)),
    changeFieldValue: (formName, fieldName, fieldValue) => dispatch(change(formName, fieldName, fieldValue)),
    resetSelectedFlow: (vssID) => dispatch(dispatch(VFSActions.selectRow(vssID))),
    selectRule: (ID, rule) => dispatch(dispatch(VFSActions.selectRow(ID, rule))),
});
