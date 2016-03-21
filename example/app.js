'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { StyleRoot } from 'radium';
import {Treebeard, decorators} from '../src/index';

import data from './data';
import styles from './styles';
import * as filters from './filter';

const HELP_MSG = 'Select A Node To See Its Data Structure Here...';

// Example: Customising The Header Decorator To Include Icons
decorators.Header = (props) => {
    const style = props.style;
    const iconType = props.node.children ? 'folder' : 'file-text';
    const iconClass = `fa fa-${iconType}`;
    const iconStyle = { marginRight: '5px' };
    return (
        <div style={style.base}>
            <div style={style.title}>
                <i className={iconClass} style={iconStyle}/>
                {props.node.name}
            </div>
        </div>
    );
};

class NodeViewer extends React.Component {
    constructor(props){
        super(props);
    }
    prepareNodeForDisplay(node) {
        if (node) {
            const clonedNode = JSON.parse(JSON.stringify(node, null, 4));

            const removeGeneratedId = targetNode => {
                if (targetNode &&
                    targetNode.id &&
                    targetNode.id.startsWith('<>__id')) {
                    delete targetNode.id;
                }
                if (targetNode.children) {
                    for (var childNode of targetNode.children) {
                        removeGeneratedId(childNode);
                    }
                }
            };

            removeGeneratedId(clonedNode);

            return clonedNode;
        }

        return undefined;
    }
    render(){
        const style = styles.viewer;
        let json = JSON.stringify(
            this.prepareNodeForDisplay(this.props.node), null, 4);
        if(!json){ json = HELP_MSG; }
        return (
            <div style={style.base}>
                {json}
            </div>
        );
    }
}

NodeViewer.propTypes = {
    node: React.PropTypes.object
};

class DemoTree extends React.Component {
    constructor(props){
        super(props);
        this.state = {data: this.prepareData(data)};
        this.onToggle = this.onToggle.bind(this);
    }
    prepareData(unprepairedData) {
        let idCounter = 0;
        const getNewUniqueId = () => `<>__id${idCounter++}`;
        for (var rootNode of this.uniformData(unprepairedData)) {
            this.generateMissingIdsForNode(rootNode, getNewUniqueId);
        }
        return unprepairedData;
    }
    uniformData(unUniformedData) {
        return Array.isArray(unUniformedData)
            ? unUniformedData
            : [unUniformedData];
    }
    generateMissingIdsForNode(node, generateId) {
        if (node.id === undefined) {
            node.id = generateId();
        }
        if (node.children) {
            for (var childNode of node.children) {
                this.generateMissingIdsForNode(childNode, generateId);
            }
        }
    }
    onToggle(node, toggled){
        if(this.state.cursor){this.state.cursor.active = false;}
        node.active = true;
        if(node.children){
            node.toggled = toggled;
            if (toggled) {
                this.unToggleSameLevelNodesAndTreirChildren(node);
            }
        }
        this.setState({ cursor: node });
    }
    unToggleSameLevelNodesAndTreirChildren(targetNode) {
        let isTargetNodeAsRootNode;
        let parent;
        const rootNodes = this.uniformData(this.state.data);
        for (var rootNode of rootNodes) {
            if (rootNode.id === targetNode.id) {
                isTargetNodeAsRootNode = rootNode;
                break;
            }
            const foundParent = this.findParent(targetNode, rootNode);
            if (foundParent) {
                parent = foundParent;
                break;
            }
        }
        let sameLevelNodes;
        if (parent !== undefined && parent.children) {
            sameLevelNodes = parent.children;
        } else if (isTargetNodeAsRootNode) {
            sameLevelNodes = rootNodes;
        }
        if (sameLevelNodes !== undefined) {
            for (var sameLevelNode of sameLevelNodes) {
                if (sameLevelNode.id !== targetNode.id) {
                    sameLevelNode.toggled = false;
                    this.untoggleChildren(sameLevelNode);
                }
            }
        }
    }
    untoggleChildren(parentNode) {
        if (parentNode.children) {
            for (var childNode of parentNode.children) {
                childNode.toggled = false;
                this.untoggleChildren(childNode);
            }
        }
    }
    findParent(targetNode, examinedNode) {
        if (examinedNode.children) {
            for (var childNode of examinedNode.children) {
                if (childNode.id === targetNode.id) {
                    return examinedNode;
                }
                const parentFromChildNode = this.findParent(targetNode, childNode);
                if (parentFromChildNode !== undefined) {
                    return parentFromChildNode;
                }
            }
            return undefined;
        }
        return undefined;
    }
    onFilterMouseUp(e){
        const filter = e.target.value.trim();
        if(!filter){ return this.setState({data}); }
        var filtered = filters.filterTree(data, filter);
        filtered = filters.expandFilteredNodes(filtered, filter);
        this.setState({data: filtered});
    }
    render(){
        return (
            <StyleRoot>
                <div style={styles.searchBox}>
                    <div className="input-group">
                        <span className="input-group-addon">
                          <i className="fa fa-search"></i>
                        </span>
                        <input type="text"
                            className="form-control"
                            placeholder="Search the tree..."
                            onKeyUp={this.onFilterMouseUp.bind(this)}
                        />
                    </div>
                </div>
                <div style={styles.component}>
                    <Treebeard
                        data={this.state.data}
                        onToggle={this.onToggle}
                        decorators={decorators}
                    />
                </div>
                <div style={styles.component}>
                    <NodeViewer node={this.state.cursor}/>
                </div>
            </StyleRoot>

        );
    }
}

const content = document.getElementById('content');
ReactDOM.render(<DemoTree/>, content);
