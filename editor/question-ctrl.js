angular.module('org.ekstep.question', ['org.ekstep.metadataform'])
.controller('QuestionCreationFormController', ['$scope', 'instance', 'questionData', function ($scope, instance, questionData) {
	$scope.templatesScreen = true;
	$scope.questionMetadataScreen = false;
	$scope.Totalconcepts = 0;
	$scope.category = '';
	$scope.editState = false;
	$scope.questionUnitTemplateURL = '';
	$scope.questionTemplates = [];
	$scope.templatesNotFound = '';
	$scope.selectedTemplatePluginData = {};
	$scope.templatesType = ['Horizontal', 'Vertical', 'Grid'];
	$scope._constants = {
		previewPlugin: 'org.ekstep.questionset.preview',
		questionPlugin: 'org.ekstep.question',
		questionsetPlugin: 'org.ekstep.questionset',
		questionbankPlugin: 'org.ekstep.questionbank'
	};
	$scope.questionData = {'questionMaxScore': 1};
	$scope.questionData.isShuffleOption = false;
	$scope.questionData.isPartialScore = true;
	$scope.questionData.templateType = $scope.templatesType[0];
	$scope.questionMetaData = {};

	$scope.init = function () {
		ecEditor.addEventListener('editor:template:loaded', function (event, object) {
			if(object.formAction == 'question-meta-save') {
				$scope.metadataform = object.templatePath;
			}
		});
		if (!ecEditor._.isEmpty(questionData)) {
			$scope.showQuestionForm(questionData);
		} else {
			$scope.showTemplates();
		}
		EventBus.listeners['editor:form:data'] = undefined;
		ecEditor.addEventListener('editor:form:data', $scope.saveMetaData);
	}
	$scope.showTemplates = function() {
		$scope.templatesScreen = true;
		$scope.questionMetadataScreen = false;
		var PluginsData = JSON.parse(localStorage.getItem("qs-plugins"));
    _.each(PluginsData, function(val, key) { // eslint-disable-line no-unused-vars
    	if (val.contentType == "Plugin") {
    		var pluginManifest = org.ekstep.pluginframework.pluginManager.getPluginManifest(val.identifier);
    		var pluginID = val.identifier;
    		var ver = val.semanticVersion;
    		if (!_.isUndefined(pluginManifest.templates)) {
          _.each(pluginManifest.templates, function(v, k) { // eslint-disable-line no-unused-vars
          	v.pluginID = pluginID;
          	v.ver = ver;
          	var thumbnail = val.appIcon;
          	v.thumbnail1 = thumbnail;
          	var allMenus = v;
          	$scope.questionTemplates.push(allMenus);
          });
        } else {
        	$scope.templatesNotFound = "There are no templates available";
        }
      }
    });
    $scope.$safeApply();
	}
	$scope.showQuestionUnitForm = function (obj) {
		$scope.category = obj.category;
		$scope.templatesScreen = false;
		$scope.questionMetadataScreen = false;
		$scope.templateName = obj.title;
		$scope.selectedTemplatePluginData.plugin = { 
			"id": obj.pluginID,
			"version": obj.ver,
			"templateId": obj.editor.template
		};
		var pluginInstance = $scope.createPluginInstance(obj.pluginID);
		pluginInstance.__proto__.__proto__._data = {};
		$scope.unitPlugin = obj.pluginID;
		$scope.pluginVer = obj.ver;
		$scope.templateId = obj.editor.template;
		var templatePath = ecEditor.resolvePluginResource(obj.pluginID, obj.ver, obj.editor.templateURL);
		$scope.questionUnitTemplateURL = templatePath + '?BUILDNUMBER';
	}
	$scope.showMetaform = function () {
		$scope.refreshPreview = false;
		$scope.validateQuestionCreationForm();
	}
	$scope.createPluginInstance = function(pluginId){
		return ecEditor.instantiatePlugin(pluginId);
	}
	$scope.validateQuestionCreationForm = function(){
  	var pluginInstance = $scope.createPluginInstance($scope.selectedTemplatePluginData.plugin.id); // Plugin id is based on template choosen
  	pluginInstance.validateForm($scope.validatedForm);
  }

  $scope.validatedForm = function(isFormValid){
  	if(isFormValid){
  		var pluginInstance = $scope.createPluginInstance($scope.selectedTemplatePluginData.plugin.id);
  		$scope.questionCreationFormData = pluginInstance.__proto__.__proto__._data;
  		$scope.setPreviewData();
  		if (!$scope.refreshPreview) {
  			$scope.formIsValid();
  		}
  	}
  }
  $scope.setPreviewData = function () {
  	var confData = {};
  	var qObj = {
  		"config": '{"metadata":{"title":"question title","description":"question description","medium":"English"},"max_time":0,"max_score":1,"partial_scoring":' + $scope.questionData.isPartialScore + ',"isShuffleOption":' + $scope.questionData.isShuffleOption + ',"layout":' + JSON.stringify($scope.questionData.templateType) + '}',
  		"data": JSON.stringify($scope.questionCreationFormData),
  		"id": "c943d0a907274471a0572e593eab49c2",
  		"pluginId": $scope.selectedTemplatePluginData.plugin.id,
  		"pluginVer": $scope.selectedTemplatePluginData.plugin.version,
  		"templateId": $scope.selectedTemplatePluginData.plugin.templateId,
  		"type": "unit"
  	}
  	var questions = [];
  	var data = {
  		"org.ekstep.questionset": {}
  	};
  	questions.push(qObj);
  	data[$scope._constants.questionsetPlugin][$scope._constants.questionPlugin] = questions;
  	confData = {"contentBody": {}, "parentElement": true, "element": "#iframeArea"};
  	document.getElementById("iframeArea").contentDocument.location.reload(true);
  	var pluginInstances = ecEditor.getPluginInstances();
  	var previewInstance = _.find(pluginInstances, function (pi) {
  		return pi.manifest.id === $scope._constants.previewPlugin
  	});
  	if (_.isUndefined(previewInstance)) {
  		previewInstance = $scope.createPluginInstance($scope._constants.previewPlugin);
  	}
  	confData.contentBody = previewInstance.getQuestionPreviwContent(data[$scope._constants.questionsetPlugin]);
  	ecEditor.dispatchEvent("atpreview:show", confData);
  };
  $scope.showPreview = function () {
  	$scope.refreshPreview = true;
  	if (!$scope.questionMetadataScreen) {
  		$scope.validateQuestionCreationForm();
  	} else {
  		$scope.setPreviewData();
  	}
  };
  $scope.cancel = function () {
  	$scope.closeThisDialog();
  }
  $scope.back = function () {
  	if(!$scope.questionMetadataScreen) {
  		$scope.questionMetadataScreen = true;
  		$scope.templatesScreen = true;
  		$scope.showTemplates();
  	} else {
  		var metaFormScope = $('#question-meta-form #content-meta-form').scope();
  		$scope.questionData.questionTitle = metaFormScope.contentMeta.name;
  		$scope.questionData.qcMedium = metaFormScope.contentMeta.medium;
  		$scope.questionData.qcLevel = metaFormScope.contentMeta.level;
  		$scope.questionData.questionDesc = metaFormScope.contentMeta.description;
  		$scope.questionData.questionMaxScore = metaFormScope.contentMeta.max_score;
  		$scope.questionData.qcGrade = metaFormScope.contentMeta.gradeLevel;
  		$scope.questionData.concepts = metaFormScope.contentMeta.concepts;
  		$scope.questionMetadataScreen = false;
  	}
  }
  $scope.formIsValid = function () {
  	$scope.questionMetadataScreen = true;
    //comment because in edit question the question and question title are not
    if ($scope.category == 'FTB') {
    	$scope.questionData.questionTitle = _.isUndefined($scope.questionData.questionTitle) ? $scope.questionCreationFormData.question.text.replace(/\[\[.*?\]\]/g, '____') : $scope.questionData.questionTitle;
    } else {
    	$scope.questionData.questionTitle = _.isUndefined($scope.questionData.questionTitle) ? $scope.questionCreationFormData.question.text : $scope.questionData.questionTitle;
    }
    $scope.questionData.questionTitle = $scope.extractHTML($scope.questionData.questionTitle);
    $scope.questionMetaData.name = $scope.questionData.questionTitle;
    $scope.questionMetaData.medium = $scope.questionData.qcMedium;
    $scope.questionMetaData.level = $scope.questionData.qcLevel;
    $scope.questionMetaData.description = $scope.questionData.questionDesc;
    $scope.questionMetaData.max_score = $scope.questionData.questionMaxScore;
    $scope.questionMetaData.gradeLevel = $scope.questionData.qcGrade;
    $scope.questionMetaData.concepts = $scope.questionData.concepts;
    $scope.questionMetaData.subject = $scope.questionData.subject;
    $scope.questionMetaData.board = $scope.questionData.board;
    if ($scope.questionMetaData.concepts) {
    	$scope.questionMetaData.conceptData = "(" + $scope.questionData.concepts.length + ") concepts selected";
    }
    ecEditor.dispatchEvent('org.ekstep.editcontentmeta:showpopup', {
    	action: 'question-meta-save',
    	subType: 'questions',
    	framework: ecEditor.getContext('framework'),
    	rootOrgId: ecEditor.getContext('channel'),
    	type: 'content',
    	popup: false,
    	metadata: $scope.questionMetaData
    });
  }
  $scope.sendMetaData = function () {
  	var formElement = $("#questionMetaDataTemplate").find("#content-meta-form");
  	var frmScope = formElement.scope();
  	ecEditor.dispatchEvent("metadata:form:onsuccess", {form: frmScope.metaForm});
  };
  $scope.saveMetaData = function (event, object) {
  	var metaDataObject = object.formData.metaData;
  	for (var property in object.formData.metaData) {
  		if (metaDataObject[property]) {
  			$scope.questionMetaData[property] = metaDataObject[property];
  		}
  	}
  	var questionFormData = {};
    var data = {}; // TODO: You have to get this from Q.Unit plugin(getData())
    data.plugin = $scope.selectedTemplatePluginData.plugin;
    data.data = $scope.questionCreationFormData; 
    var metadataObj = { category: $scope.category, title:  $scope.questionMetaData.name, medium: $scope.questionMetaData.medium, qlevel:  $scope.questionMetaData.level, gradeLevel:  $scope.questionMetaData.gradeLevel, concepts:  $scope.questionMetaData.concepts, description:  $scope.questionMetaData.description, max_score:  $scope.questionMetaData.max_score, subject:  $scope.questionMetaData.subject, board:  $scope.questionMetaData.board  };
    data.config = { "metadata": metadataObj, "max_time": 0, "max_score": $scope.questionData.questionMaxScore, "partial_scoring": $scope.questionData.isPartialScore, "layout": $scope.questionData.templateType, "isShuffleOption" : $scope.questionData.isShuffleOption, "questionCount": $scope.questionCreationFormData.questionCount};
    data.media = $scope.questionCreationFormData.media;
    questionFormData.data = data;
    var metadata = {
    	"code": "NA",
    	"name": $scope.questionMetaData.name,
    	"qlevel": $scope.questionMetaData.level,
    	"title": $scope.questionMetaData.name,
    	"question": $scope.questionCreationFormData.question.text,
    	"max_score": $scope.questionMetaData.max_score,
    	"isShuffleOption" : $scope.questionData.isShuffleOption,
    	"body": JSON.stringify(questionFormData),
    	"medium": $scope.questionMetaData.medium,
    	"subject": $scope.questionMetaData.subject,
    	"board": $scope.questionMetaData.board,
    	"itemType": "UNIT",
    	"version": 2,
    	"category": $scope.category,
    	"description": $scope.questionMetaData.description,
    	"createdBy": window.context.user.id,
    	"channel": ecEditor.getContext('channel'),
      "type": $scope.category.toLowerCase(), // backward compatibility
      "template": "NA", // backward compatibility
      "template_id": "NA", // backward compatibility
    };
    var dynamicOptions = [{"answer": true, "value": {"type": "text", "asset": "1"}}];
    var mtfoptions = [{
    	"value": {
    		"type": "mixed",
    		"text": "इक",
    		"image": "",
    		"count": "",
    		"audio": "",
    		"resvalue": "इक",
    		"resindex": 0
    	},
    	"index": 0
    }];
    switch ($scope.category) {
    	case 'MCQ':
    	metadata.options = dynamicOptions;
    	break;
    	case 'FTB':
    	metadata.answer = dynamicOptions;
    	break;
    	case 'MTF':
    	metadata.lhs_options = mtfoptions;
    	metadata.rhs_options = mtfoptions;
    	break;
    	default:
    	metadata.options = dynamicOptions;
    	break;
    }
    $scope.qFormData = {
    	"request": {
    		"assessment_item": {
    			"objectType": "AssessmentItem",
    			"metadata": metadata
    		}
    	}
    };
    /*Save data and get response and dispatch event with response to questionbank plugin*/
    $scope.saveQuestion($scope.assessmentId, $scope.qFormData);
  };
  $scope.saveQuestion = function (assessmentId, data) {
  	ecEditor.getService('assessment').saveQuestionV3(assessmentId, data, function (err, resp) {
  		if (!err) {
  			var qMetadata = $scope.qFormData.request.assessment_item.metadata;
  			qMetadata.identifier = resp.data.result.node_id;
  			ecEditor.dispatchEvent($scope._constants.questionbankPlugin + ':saveQuestion', qMetadata);
  			$scope.closeThisDialog();
  		} else {
  			ecEditor.dispatchEvent("org.ekstep.toaster:error", {
  				title: 'Failed to save question...',
  				position: 'topCenter',
  			});
  		}
  	});
  }
  $scope.showQuestionForm = function (qData) {
  	$scope.templatesScreen = false;
  	$scope.questionMetadataScreen = false;
  	$scope.editMode = true;
  	var questionData1 = typeof questionData.body == "string" ? JSON.parse(questionData.body) : questionData.body;
  	$scope.assessmentId = questionData.identifier;
  	$scope.questionData = questionData1;
  	$scope.questionCreationFormData = questionData1.data.data;
  	$scope.questionData.qcMedium = questionData1.data.config.metadata.medium;
  	$scope.questionData.questionTitle = questionData1.data.config.metadata.title;
  	$scope.questionData.qcLevel = questionData1.data.config.metadata.qlevel;
  	$scope.questionData.subject = questionData1.data.config.metadata.subject;
  	$scope.questionData.board = questionData1.data.config.metadata.board;
  	$scope.questionData.templateType = questionData1.data.config.layout;
  	$scope.questionData.isPartialScore = questionData1.data.config.partial_scoring;
  	$scope.questionData.qcGrade = questionData1.data.config.metadata.gradeLevel;
  	$scope.questionData.isShuffleOption = questionData1.data.config.isShuffleOption;
  	$scope.category = questionData.category;
  	if (questionData1.data.config.metadata.concepts) {
  		$scope.Totalconcepts = questionData1.data.config.metadata.concepts.length;
  	}
  	$scope.questionData.concepts = questionData1.data.config.metadata.concepts;
  	$scope.selectedConceptsData = questionData1.data.config.metadata.concepts;
  	$scope.questionData.questionDesc = questionData1.data.config.metadata.description;
  	$scope.questionData.questionMaxScore = questionData1.data.config.metadata.max_score;
  	$scope.conceptsCheck = true;
  	var pluginID = questionData1.data.plugin.id;
  	var pluginVer = questionData1.data.plugin.version;
  	var pluginTemplateId = questionData1.data.plugin.templateId;
  	var editCreateQuestionFormInstance = org.ekstep.pluginframework.pluginManager.getPluginManifest(questionData1.data.plugin.id);
    _.each(editCreateQuestionFormInstance.templates, function (value, key) { // eslint-disable-line no-unused-vars
    	if (value.editor.template == questionData1.data.plugin.templateId) {
    		var templatePathEdit = ecEditor.resolvePluginResource(pluginID, pluginVer, value.editor.templateURL);
    		$scope.questionUnitTemplateURL = templatePathEdit;
    	}
    });
    $scope.selectedTemplatePluginData.plugin = { // Question Unit Plugin Information
      "id": pluginID, // Id of plugin
      "version": pluginVer, // Version of plugin
      "templateId": pluginTemplateId // Template Id of the question unit
    };
    //Set question form data in edit mode
    var pluginInstance = $scope.createPluginInstance(questionData1.data.plugin.id);
    pluginInstance.renderForm(questionData1.data);
    $scope.$safeApply();
  };
  $scope.extractHTML = function(htmlElement) {
  	var divElement= document.createElement('div');
  	divElement.innerHTML= htmlElement;
  	return divElement.textContent || divElement.innerText;
  }
  $scope.genImpressionTelemetry = function(data) {
  	if (data) ecEditor.getService('telemetry').impression({
  		"type": data.type,
  		"subtype": data.subtype,
  		"pageid": data.pageid,
  		"uri": encodeURIComponent(location.href),
  		"visits": {
  			'objid': data.visits.objid,
  			'objtype': data.visits.objtype
  		}
  	})
  }
  $scope.generateTelemetry = function(data, event) {
  	if (data) ecEditor.getService('telemetry').interact({
  		"type": data.type,
  		"id": data.id,
  		"pageid": 'question-creation-form',
  		"target": {
  			"id": data.target.id,
  			"ver": data.target.ver,
  			"type": data.target.type
  		},
  		"plugin": {
  			"id": instance.manifest.id,
  			"ver": instance.manifest.ver
  		}
  	})
  }
  $scope.init();
}]);

//# sourceURL=questionCtrl.js