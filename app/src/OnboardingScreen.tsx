import React from 'react'
import { View, Image, Dimensions, LayoutAnimation } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { observer } from 'mobx-react/native'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import SafeAreaView from 'react-native-safe-area-view'

import { FontFamily, Color, FontSize, Margin } from './Constants'
import Text from './Text'

const DEVICE_WIDTH = Dimensions.get('window').width

@observer
export default class OnboardingScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  carousel: any

  onboardingContent = [
    {
      image: require('../assets/light-bulb.png'),
      title: 'Discover',
      body: `The Greek and Hebrew\nof the Bible`,
      button: 'NEXT',
    },
    {
      image: require('../assets/hand.png'),
      title: 'Tap Any Blue Word',
      body: `To unlock the original meaning`,
      button: 'GET STARTED',
    },
  ]

  state = {
    ready: false,
    activeIndex: 0,
  }

  constructor(props) {
    super(props)
    setTimeout(() => {
      const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity')
      LayoutAnimation.configureNext(animation)
      this.setState({ ...this.state, ready: true })
    }, 100)
  }

  onPressNext = () => {
    const isAtEnd = this.state.activeIndex === this.onboardingContent.length - 1
    if (isAtEnd) {
      this.props.navigation.navigate('OfflineLoading')
    }
    this.carousel.snapToNext()
  }

  onSnapToItem = activeIndex => {
    this.setState({ ...this.state, activeIndex })
  }

  render() {
    if (this.state.ready === false) {
      return <View />
    }
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Carousel
            containerCustomStyle={{ flex: 1 }}
            data={this.onboardingContent}
            ref={c => {
              this.carousel = c
            }}
            onSnapToItem={this.onSnapToItem}
            renderItem={this.renderItem}
            sliderWidth={DEVICE_WIDTH}
            itemWidth={DEVICE_WIDTH}
          />
          <View style={{ flex: 0.3 }}>
            <Pagination
              activeDotIndex={this.state.activeIndex}
              dotsLength={this.onboardingContent.length}
              dotColor={Color.TYNDALE_BLUE}
              dotStyle={{ height: 10, width: 10, borderRadius: 5 }}
              inactiveDotColor={'#C4C4C4'}
              inactiveDotScale={1}
            />
            <TouchableRipple
              onPress={this.onPressNext}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Color.TYNDALE_BLUE,
                minHeight: 42,
                maxHeight: 42,
                borderRadius: 4,
                marginLeft: Margin.MEDIUM,
                marginRight: Margin.MEDIUM,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontFamily: FontFamily.OPEN_SANS_BOLD,
                  fontSize: FontSize.SMALL,
                }}
              >
                {this.onboardingContent[this.state.activeIndex].button}
              </Text>
            </TouchableRipple>
          </View>
        </View>
      </SafeAreaView>
    )
  }
  renderItem({ item, index }) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image style={{ width: 100, height: 100 }} source={item.image} />
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS_BOLD,
            fontSize: FontSize.LARGE,
            marginTop: 58,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS,
            fontSize: FontSize.LARGE,
            margin: Margin.LARGE,
            textAlign: 'center',
          }}
        >
          {item.body}
        </Text>
      </View>
    )
  }
}
