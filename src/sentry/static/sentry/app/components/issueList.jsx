import React from 'react';

import ApiMixin from '../mixins/apiMixin';
import CompactIssue from './compactIssue';
import LoadingError from './loadingError';
import LoadingIndicator from './loadingIndicator';
import Pagination from './pagination';
import {t} from '../locale';

const IssueList = React.createClass({
  propTypes: {
    endpoint: React.PropTypes.string.isRequired,
    query: React.PropTypes.object,
    pagination: React.PropTypes.bool,
    renderEmpty: React.PropTypes.func,
    statsPeriod: React.PropTypes.string,
    showActions: React.PropTypes.bool
  },

  mixins: [ApiMixin],

  getDefaultProps() {
    return {
      pagination: true,
      query: {}
    };
  },

  getInitialState() {
    return {
      issueIds: [],
      loading: true,
      error: false,
      pageLinks: null
    };
  },

  componentWillMount() {
    this.fetchData();
  },

  componentWillReceiveProps(nextProps) {
    let location = this.props.location;
    let nextLocation = nextProps.location;
    if (!location) return;

    if (
      location.pathname != nextLocation.pathname || location.search != nextLocation.search
    ) {
      this.remountComponent();
    }
  },

  remountComponent() {
    this.setState(this.getInitialState(), this.fetchData);
  },

  fetchData() {
    let location = this.props.location;
    this.api.clear();
    this.api.request(this.props.endpoint, {
      method: 'GET',
      query: {
        cursor: (location && location.query && location.query.cursor) || '',
        ...this.props.query
      },
      success: (data, _, jqXHR) => {
        this.setState({
          data: data,
          loading: false,
          error: false,
          issueIds: data.map(item => item.id),
          pageLinks: jqXHR.getResponseHeader('Link')
        });
      },
      error: () => {
        this.setState({
          loading: false,
          error: true
        });
      }
    });
  },

  renderResults() {
    let body;
    let params = this.props.params;

    if (this.state.loading) body = this.renderLoading();
    else if (this.state.error) body = <LoadingError onRetry={this.fetchData} />;
    else if (this.state.issueIds.length > 0) {
      body = (
        <ul className="issue-list">
          {this.state.data.map(issue => {
            return (
              <CompactIssue
                key={issue.id}
                id={issue.id}
                data={issue}
                orgId={params.orgId}
                statsPeriod={this.props.statsPeriod}
                showActions={this.props.showActions}
              />
            );
          })}
        </ul>
      );
    } else body = (this.props.renderEmpty || this.renderEmpty)();

    return body;
  },

  renderLoading() {
    return (
      <div className="box">
        <LoadingIndicator />
      </div>
    );
  },

  renderEmpty() {
    return <div className="box empty">{t('Nothing to show here, move along.')}</div>;
  },

  render() {
    return (
      <div>
        {this.renderResults()}
        {this.props.pagination &&
          this.state.pageLinks &&
          <Pagination pageLinks={this.state.pageLinks} {...this.props} />}
      </div>
    );
  }
});

export default IssueList;
