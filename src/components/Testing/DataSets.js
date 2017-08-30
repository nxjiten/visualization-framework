import React, { Component } from "react";
import style from "./style";
import { Button,Collapse } from 'react-bootstrap';
import $ from 'jquery';

const initialState = {
	reportsDetails : [],
	open : false,
	showMessage : false
};
let config = {
    timingCache: 5000,
    api: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "http://localhost:8010/middleware/api/",
}
class DataSets extends Component {
    
    constructor() {
        super();
        this.state = initialState;
        this.handleSaveDataSet = this.handleSaveDataSet.bind(this);
    }

    handleSaveDataSet(reportId,dashboardId,datasetId) {
    	var optionSelect = $('input[name=option_'+reportId+'_'+dashboardId+'_'+datasetId+']:checked').val();
    	//var optionSelect = $('#pass_'+reportId+'_'+dashboardId+'_'+datasetId).val();
    	let url = config.api + "testing/update/reports/"+reportId+"/"+dashboardId+"/"+datasetId+"/"+optionSelect;
    	fetch(url).then(
		  	function(response){
		     return response.json();
		    }
		).then(jsonData => {
			$('#message_'+reportId+'_'+dashboardId+'_'+datasetId).show();
		});
    }

    render() {
    	console.log(this.props.dataset);
    	if(this.props.dataset) {
    		var Collapsable = this.props.dataset.map((response)=> 
    			<Collapse in={this.props.open} key={response.dataSetId}>
	                  	<div >
		                 <div className="panel-heading col-lg-10 col-md-10 col-sm-offset-1" style={style.dashboardTab} role="tab">
			                <h4 className="panel-title alert alert-info" style={style.dataSetTab}>
			                    <a href="#">
			                        {response.name} #{response.dataSetId}
			                    </a>
			                </h4>
		            	</div>
		            	<div className="col-lg-10 col-md-10 col-sm-offset-1" style={style.dashboardTab}>
							<div className="col-lg-4 col-md-4">
								<div style={{paddingLeft: "35px"}}><b>Original</b></div>
								<div>
									<img role="presentation" src={require("../../../public/uploads/2/8/17/checkout.png")} />
								</div>
							</div>
							<div className="col-lg-4 col-md-4">
								<div style={{paddingLeft: "35px"}}><b>Captured</b></div>
								<div><img role="presentation" src={require("../../../public/uploads/2/8/17/checkout.png")} /></div>
							</div>
							<div className="col-lg-4 col-md-4" style={{textAlign:"right"}}>
								<div><b>Action</b></div>
								<div>
									<div className="alert alert-info" id={"message_"+this.props.report_id+"_"+response.dashboard_id+"_"+response.dataSetId} style={{textAlign:"center",display:"none"}} >
									  <strong>Saved!</strong>
									</div>
									<input type="radio" id={"pass_"+this.props.report_id+"_"+response.dashboard_id+"_"+response.dataSetId} name={"option_"+this.props.report_id+"_"+response.dashboard_id+"_"+response.dataSetId} value="pass" />Pass
									<input type="radio" id={"fail_"+this.props.report_id+"_"+response.dashboard_id+"_"+response.dataSetId} name={"option_"+this.props.report_id+"_"+response.dashboard_id+"_"+response.dataSetId} value="fail" />Fail
									<Button 
										bsStyle="primary" 
										bsSize="small" 
									 	onClick={this.handleSaveDataSet.bind(this, this.props.report_id,response.dashboard_id,response.dataSetId)}
									 >Save</Button>
								</div>
							</div>
	                    </div>
	                </div>
	            </Collapse> 
    		);
    	}
        return (
            <div>
    			{Collapsable}

            </div>
        )
    }
}

export default DataSets;