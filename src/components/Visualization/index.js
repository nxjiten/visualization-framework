import React from "react";
import { connect } from "react-redux";
import { push } from "redux-router";

import AppBar from "material-ui/AppBar";
import CircularProgress from "material-ui/CircularProgress";
import { theme } from "../../theme";

import { Actions } from "./redux/actions";
import {
    Actions as ServiceActions,
    ActionKeyStore as ServiceActionKeyStore
} from "../../services/servicemanager/redux/actions";
import {
    Actions as ConfigurationsActions,
    ActionKeyStore as ConfigurationsActionKeyStore
} from "../../services/configurations/redux/actions";

import { parameterizedConfiguration } from "../../utils/configurations";
import { GraphManager } from "../Graphs/index";
import { ServiceManager } from "../../services/servicemanager/index";

const style = {
    navBar: {
        background: theme.palette.primary2Color,
    },
    card: {
        border: theme.palette.thinBorder + theme.palette.primary2Color,
        borderRadius: theme.palette.smallBorderRadius,
        height: "100%"
    }
};


class VisualizationView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            initializing: false,
            parameterizable: true,
            hasResults:false,
        }
    }

    componentWillMount() {
        this.initialize(this.props.id);
    }

    componentWillReceiveProps(nextProps) {
        this.initialize(nextProps.id);
    }

    initialize(id) {

        // if (this.state.initializing)
        //     return;

        this.setState({initializing: true});

        this.props.fetchConfigurationIfNeeded(id).then(() => {
            const { configuration } = this.props

            if (!configuration)
                return;

            this.props.fetchQueryIfNeeded(configuration.get("query")).then(() => {
                const { queryConfiguration, executeQueryIfNeeded, context } = this.props;

                if (!queryConfiguration)
                    return;

                const pQuery = parameterizedConfiguration(queryConfiguration, context);

                this.setState({
                    initializing: false,
                    parameterizable: !!pQuery,
                });

                if (pQuery)
                    executeQueryIfNeeded(pQuery);
            });
        });
    }

    shouldShowVisualization() {
        const { configuration, response } = this.props;

        return configuration && response && !response.isFetching;
    }

    renderVisualization() {
        const { configuration, response } = this.props;

        const graphName      = configuration.get("graph") || "ImageGraph",
              GraphComponent = GraphManager.getGraphComponent(graphName);

        return (
            <GraphComponent response={response} configuration={configuration.toJS()} />
        )
    }

    renderVisualizationIfPossible() {

        if (this.shouldShowVisualization()) {
            return this.renderVisualization();
        }

        if (!this.state.parameterizable) {
            return (
                <div>Oops, we are missing some parameters here!</div>
            )
        }

        return (
            <CircularProgress color="#eeeeee"/>
        )
    }

    render() {
        const { configuration } = this.props;
        let title = configuration ? configuration.get("title") : "Loading...";

        return (
            <div style={style.card}>
                <AppBar
                    title={title}
                    showMenuIconButton={false}
                    style={style.navBar}
                    />
                { this.renderVisualizationIfPossible() }
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {

    const props = {

        configuration: state.configurations.getIn([
            ConfigurationsActionKeyStore.VISUALIZATIONS,
            ownProps.id,
            ConfigurationsActionKeyStore.DATA
        ]),

        error: state.configurations.getIn([
            ConfigurationsActionKeyStore.VISUALIZATIONS,
            ownProps.id,
            ConfigurationsActionKeyStore.ERROR
        ])

    };

    // Expose the query template as a JS object if it is available.
    if (props.configuration) {

        const queryConfiguration = state.configurations.getIn([
            ConfigurationsActionKeyStore.QUERIES,
            props.configuration.get("query")
        ]);

        if (queryConfiguration && !queryConfiguration.get(
            ConfigurationsActionKeyStore.IS_FETCHING
        )) {
            props.queryConfiguration = queryConfiguration.get(
                ConfigurationsActionKeyStore.DATA
            ).toJS();
        }

        // Expose received response if it is available
        if (props.queryConfiguration) {
            const pQuery = parameterizedConfiguration(props.queryConfiguration, ownProps.context);

            if (pQuery) {
                const requestID = ServiceManager.getRequestID(pQuery.query, pQuery.service);

                let response = state.services.getIn([
                    ServiceActionKeyStore.REQUESTS,
                    requestID
                ]);

                if (response && !response.get(ServiceActionKeyStore.IS_FETCHING))
                    props.response = response.toJS();
            }

        }
    }

    return props;
};


const actionCreators = (dispatch) => ({

    setPageTitle: function(aTitle) {
        dispatch(Actions.updateTitle(aTitle));
    },

    goTo: function(link, filters) {
        dispatch(push({pathname:link, query:filters}));
    },

    fetchConfigurationIfNeeded: function(id) {
        return dispatch(ConfigurationsActions.fetchIfNeeded(
            id,
            ConfigurationsActionKeyStore.VISUALIZATIONS
        ));
    },

    fetchQueryIfNeeded: function(id) {
        return dispatch(ConfigurationsActions.fetchIfNeeded(
            id,
            ConfigurationsActionKeyStore.QUERIES
        ));
    },

    executeQueryIfNeeded: function(pQuery) {
        return dispatch(ServiceActions.fetchIfNeeded(pQuery.query, pQuery.service));
    }

 });


export default connect(mapStateToProps, actionCreators)(VisualizationView);
