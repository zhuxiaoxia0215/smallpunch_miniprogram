let app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    projectId: 0,
    isCreator: 1,
    inputShowed: true,
    inputVal: "",

    // 符合搜索添加的成员列表
    attendUserList: [],

    pageNo: 1, // 符合条件的搜索记录页码,默认第一页开始
    pageSize: 8, // 每一页的数据记录条数
    showSearchLoading: false, // 搜索加载动画
    moreSearchDataLoad: false, // 控制上拉加载更多符合搜索关键字的打卡圈子数据的加载动画
    notMoreSearchData: false, // 符合条件的打卡圈子已全部加载标志
    showDelete: false,

    scrollTimer: '',
    scrollArr: '',
    direction: 0,
    searchBarFixClass: ''
  },

    /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    let that = this;
    that.setData({
      projectId: parseInt(options.projectId),
      isCreator: parseInt(options.isCreator),
  });
  },

  // 进入搜素输入状态
  showInput: function () {
    this.setData({
      inputShowed: true
    });
  },

  // 关闭输入状态
  hideInput: function () {
    this.setData({
      inputVal: "",
      inputShowed: false,

      // 清空上一次查询到结果记录&&并重新初始化相关状态变量
      attendUserList: [],
      pageNo: 1,
      notMoreSearchData: false
    });
  },

  // 清除搜索的内容
  clearInput: function () {
    this.setData({
      inputVal: "",
      inputShowed: true,

      // 清空上一次查询到结果记录&&并重新初始化相关状态变量
      attendUserList: [],
      pageNo: 1,
      notMoreSearchData: false
    });
  },

  // 监听输入内容
  inputTyping: function (e) {
    this.setData({
      inputVal: e.detail.value
    });
  },

  // 监听键盘的搜索按钮点击事件，若点击则进行打卡圈子搜素
  search: function () {
    let that = this;

    // 获取用户输入的搜索关键字
    let keyword = that.data.inputVal;

    if (keyword.length <= 0) {
      wx.showToast({
        title: '请输入搜索关键字',
        icon: 'none',
        duration: 1000
      });
      return false;
    }

    // 开启成员搜索中的加载动画
    that.setData({
      showSearchLoading: true
    });

    // 这时候获取到符合搜索条件的数据为第一页的
    that.searchAttendUser(keyword, 1, that.data.pageSize,that.data.projectId, function (res) {
      console.log("搜索中");
      let respData = res.data;

      switch (res.statusCode) {
        case 200:
          that.data.punchCardDiaryList = [];
          that.setData({
            showSearchLoading: false, // 关闭搜索中加载动画
            attendUserList: respData.data,
            pageNo: 1
          });
          break;

          // 没有符合搜索关键字的打卡圈子数据
        case 400:
          that.setData({
            showSearchLoading: false
          });
          wx.showToast({
            title: '没有符合的用户',
            icon: 'none',
            duration: 2000
          });
          break;

        default:
          wx.showToast({
            title: respData.errMsg,
            icon: 'none',
            duration: 2000
          });
          break;
      }
    })
  },

  // 上拉加载更多符合搜索关键字的打卡圈子列表数据
  onReachBottom: function () {
    let that = this,
        nextPageNo = that.data.pageNo + 1,
        keyword = that.data.inputVal;

    // 如果符合查询关键字的打卡圈子列表加载完毕则不再进行请求
    if (that.data.notMoreSearchData === true)
      return false;

    // 显示加载下一页数据的加载动画
    that.setData({
      moreSearchDataLoad: true
    });

    that.searchAttendUser(keyword, nextPageNo, that.data.pageSize, that.data.projectId, function (res) {
      let respData = res.data;
      switch (res.statusCode) {
        case 200:
          let length = respData.data.length;

          // 当前请求页已经没有数据，说明上一页为最后一页数据
          if (length <= 0) {
            that.setData({
              notMoreSearchData: true, // 设置符合搜索关键字的打卡圈子列表数据已经全部加载
              moreSearchDataLoad: false, // 关闭加载更多动画
              pageNo: nextPageNo - 1
            });

          } else {
            // 将当前请求页的数据追加到前面已获取的数据列表中
            for (let i = 0; i < length; i++) {
              that.data.attendUserList[length + i] = respData.data[i];
            }
            that.setData({
              notMoreSearchData: false, // 下一页是否还有符合的数据未知
              moreSearchDataLoad: false,
              pageNo: nextPageNo, // 修改当前请求页为最新获取的页号
              attendUserList: that.data.attendUserList
            });
          }
          break;

        default:
          wx.showToast({
            title: respData.errMsg,
            icon: 'none',
            duration: 2000
          });
          break;
      }
    });
  },

  /**
   * 向服务器端获取打卡圈子搜索数据，分页返回符合搜索条件的数据
   * @param keyword 搜索添加字符串
   * @param pageNo 符合条件的数据的页号
   * @param pageSize 每页返回的数据条数
   * @param projectId 圈子ID
   * @param callback 请求成功后的回调处理函数
   */
  searchAttendUser: function (keyword, pageNo, pageSize,projectId, callback) {
    wx.request({
      url: app.globalData.urlRootPath + 'index/attendUser/search',
      'method': 'post',
      data: {
        pageNo: pageNo,
        pageSize: pageSize,
        keyword: keyword,
        projectId: projectId
      },
      success: function (res) {
        // 请求成功后执行对应的函数进行后续处理
        callback && callback(res);
      },
      fail: function () {
        wx.showToast({
          title: '网络异常!',
          icon: 'none',
          duration: 2000
        });
      }
    })
  },

  onPageScroll: function (e) {
    let that = this;
    clearTimeout(this.scrollTimer);
    this.scrollArr = Array.isArray(this.scrollArr) ? this.scrollArr : []; //记录滚动坐标
    this.scrollArr.push(e.scrollTop);
    if (this.scrollArr.length > 2) {
      that.searchBarFixClass = ''
      if (e.scrollTop !== 0 && (this.scrollArr[this.scrollArr.length - 1] - this.scrollArr[0]) <= 0) {
        that.searchBarFixClass = 'search-bar-fix';
      }
      that.setData({
        searchBarFixClass: that.searchBarFixClass
      });

      //1向下滚动  -1向上滚动
      this.direction = (this.scrollArr[this.scrollArr.length - 1] - this.scrollArr[0]) > 0 ? 1 : -1;
      console.log('direction -- ', this.direction);
    }
    this.scrollTimer = setTimeout(() => {//延迟清除记录
      this.scrollArr = [];
    }, 100);
  },

      // 移除用户
   deleteUser: function(e) {
        console.log(e);
        let that = this;
        let userIndex = e.currentTarget.dataset.userIndex;
        let projecctId = that.data.projectId;
        console.log(that.data.attendUserList[userIndex].id);

        wx.showModal({
          title: '温馨提示',
          content: '确认要移除用户？',
          confirmText: '确认移除',
          confirmColor: '#E53935',
          success: function (res) {

            if (res.confirm) {
                wx.request({
                    url: app.globalData.urlRootPath
                        + 'index/attendUser/delete',
                    method: 'post',
                    data: {
                        userId: that.data.attendUserList[userIndex].id,
                        projectId: that.data.projectId
                    },
                    success: function (res) {
                        console.log(res);
                        switch (res.statusCode) {
                            case 200:
                                    // 删除本地该条打卡日记
                                    that.setData({
                                      attendUserList: that.data.attendUserList
                                    });
                                    break;
                                let title ="移除成功";

                                wx.showToast({
                                    title: title

                                });
                                break;
                            default:
                                wx.showToast({
                                    title: "移除失败！",
                                    icon: 'none',
                                    duration: 2000
                                });
                                break;
                        }
                    },
                    fail: function () {
                        wx.showToast({
                            title: '网络异常',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                   });
            }
           }
  });
},
});
